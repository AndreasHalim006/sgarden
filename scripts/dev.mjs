#!/usr/bin/env node

import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";

const services = [
	{
		name: "backend",
		port: 4000,
		url: "http://localhost:4000/api",
		args: ["run", "backend:dev"],
		readyText: "http://localhost:4000",
		env: {},
	},
	{
		name: "frontend",
		port: 3002,
		url: "http://localhost:3002",
		args: ["run", "frontend:start"],
		readyText: "http://localhost:3002",
		env: {
			BROWSER: "none",
			PORT: "3002",
		},
	},
];

const spawned = [];

function log(message = "") {
	process.stdout.write(`${message}\n`);
}

function ping(url) {
	return new Promise((resolve) => {
		const request = http.get(url, (response) => {
			response.resume();
			resolve(response.statusCode < 600);
		});

		request.on("error", () => resolve(false));
		request.setTimeout(2000, () => {
			request.destroy();
			resolve(false);
		});
	});
}

function isPortOpen(port) {
	return new Promise((resolve) => {
		const socket = net.createConnection({ host: "127.0.0.1", port });

		socket.once("connect", () => {
			socket.destroy();
			resolve(true);
		});

		socket.once("error", () => resolve(false));
		socket.setTimeout(1000, () => {
			socket.destroy();
			resolve(false);
		});
	});
}

function waitForService(service) {
	return new Promise((resolve, reject) => {
		const deadline = Date.now() + 120_000;

		const check = async () => {
			if (await ping(service.url)) {
				resolve();
				return;
			}

			if (Date.now() > deadline) {
				reject(new Error(`${service.name} did not become reachable at ${service.url}`));
				return;
			}

			setTimeout(check, 1000);
		};

		check();
	});
}

function startService(service) {
	log(`Starting ${service.name} on ${service.readyText}`);

	const child = spawn(npmCommand, service.args, {
		cwd: root,
		env: { ...process.env, ...service.env },
		stdio: "inherit",
		shell: isWindows,
		...(isWindows ? { windowsHide: true } : {}),
	});

	child.on("exit", (code, signal) => {
		if (shuttingDown) return;
		const reason = signal ? `signal ${signal}` : `code ${code}`;
		log(`${service.name} exited with ${reason}`);
		stopSpawned();
		process.exit(code ?? 1);
	});

	child.on("error", (error) => {
		log(`${service.name} failed to start: ${error.message}`);
		stopSpawned();
		process.exit(1);
	});

	spawned.push(child);
}

let shuttingDown = false;

function stopSpawned() {
	shuttingDown = true;

	for (const child of spawned) {
		if (!child.pid || child.killed) continue;

		if (isWindows) {
			spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"], {
				stdio: "ignore",
				windowsHide: true,
			});
		} else {
			child.kill("SIGTERM");
		}
	}
}

process.on("SIGINT", () => {
	log("");
	log("Stopping dev services...");
	stopSpawned();
	process.exit(130);
});

process.on("SIGTERM", () => {
	stopSpawned();
	process.exit(143);
});

log("Checking SGarden dev ports...");

for (const service of services) {
	if (await ping(service.url)) {
		log(`${service.name} already running at ${service.readyText}`);
		continue;
	}

	if (await isPortOpen(service.port)) {
		log(`${service.name} cannot start: port ${service.port} is already in use, but ${service.url} is not responding as expected.`);
		process.exit(1);
	}

	startService(service);
	await waitForService(service);
	log(`${service.name} ready at ${service.readyText}`);
}

log("");
log("Dev environment ready:");
log("  frontend: http://localhost:3002");
log("  backend:  http://localhost:4000");
log("");
log("Press Ctrl+C to stop services started by this command.");

setInterval(() => {}, 2_147_483_647);

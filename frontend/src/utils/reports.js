const REPORTS_STORAGE_KEY = "sgarden:reports";

const overviewMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const makeSeries = (length, minimum, maximum, offset = 0) => Array.from({ length }, (_, index) => {
	const wave = Math.sin((index + 1 + offset) * 1.2) * 0.5 + 0.5;
	const drift = ((index + offset) % 5) / 10;
	return Math.round((minimum + (maximum - minimum) * ((wave + drift) / 1.5)) * 10) / 10;
});

const makeSingleMetric = (label, value, color = "primary") => ({
	data: [{
		x: [label],
		y: [value],
		type: "bar",
		color,
		title: label,
	}],
	showLegend: false,
	title: label,
	titleColor: "primary",
	titleFontSize: 16,
	displayBar: false,
	height: "260px",
	marginBottom: 70,
});

export const REPORT_CHART_DEFINITIONS = [
	{ id: "monthly-revenue", name: "Monthly Revenue", group: "Overview" },
	{ id: "new-customers", name: "New Customers", group: "Overview" },
	{ id: "active-subscriptions", name: "Active Subscriptions", group: "Overview" },
	{ id: "weekly-sales", name: "Weekly Sales", group: "Overview" },
	{ id: "revenue-trend", name: "Revenue Trend", group: "Overview" },
	{ id: "customer-satisfaction", name: "Customer Satisfaction", group: "Overview" },
	{ id: "revenue", name: "Revenue", group: "Analytics" },
	{ id: "expenses", name: "Expenses", group: "Analytics" },
	{ id: "profit", name: "Profit", group: "Analytics" },
	{ id: "growth-rate", name: "Growth Rate", group: "Analytics" },
	{ id: "quarterly-sales-distribution", name: "Quarterly Sales Distribution", group: "Insights" },
	{ id: "budget-vs-actual-spending", name: "Budget vs Actual Spending", group: "Insights" },
	{ id: "performance-over-time", name: "Performance Over Time", group: "Insights" },
];

export const getDefaultDateRange = () => {
	const to = new Date();
	const from = new Date();
	from.setDate(to.getDate() - 30);

	return {
		dateFrom: from.toISOString().slice(0, 10),
		dateTo: to.toISOString().slice(0, 10),
	};
};

export const readReports = () => {
	try {
		const stored = window.localStorage.getItem(REPORTS_STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
};

export const writeReports = (reports) => {
	window.localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
};

export const getReportById = (id) => readReports().find((report) => report.id === id);

export const deleteReportById = (id) => {
	const nextReports = readReports().filter((report) => report.id !== id);
	writeReports(nextReports);
	return nextReports;
};

export const createReportSnapshot = (chartIds) => chartIds.map((chartId) => {
	const definition = REPORT_CHART_DEFINITIONS.find((chart) => chart.id === chartId);
	const title = definition?.name || chartId;

	switch (chartId) {
		case "monthly-revenue":
			return { id: chartId, title, group: definition.group, plot: makeSingleMetric(title, 73, "primary") };
		case "new-customers":
			return { id: chartId, title, group: definition.group, plot: makeSingleMetric(title, 4280, "secondary") };
		case "active-subscriptions":
			return { id: chartId, title, group: definition.group, plot: makeSingleMetric(title, 62400, "third") };
		case "weekly-sales":
			return {
				id: chartId,
				title,
				group: definition.group,
				plot: {
					data: [{ x: shortWeekdays, y: makeSeries(7, 28, 96, 2), type: "bar", color: "third", title }],
					showLegend: false,
					title: "Transactions per day",
					titleColor: "primary",
					titleFontSize: 16,
					displayBar: false,
					height: "280px",
				},
			};
		case "revenue-trend":
			return {
				id: chartId,
				title,
				group: definition.group,
				plot: {
					data: [{ x: overviewMonths, y: makeSeries(12, 120, 480, 5), type: "scatter", mode: "lines+markers", color: "third", title }],
					showLegend: false,
					title: "Revenue trend",
					titleColor: "primary",
					titleFontSize: 16,
					displayBar: false,
					height: "280px",
				},
			};
		case "customer-satisfaction":
			return {
				id: chartId,
				title,
				group: definition.group,
				plot: {
					data: [{ x: overviewMonths, y: makeSeries(12, 62, 96, 8), type: "scatter", mode: "lines+markers", color: "secondary", title }],
					showLegend: false,
					title: "Customer satisfaction score",
					titleColor: "primary",
					titleFontSize: 16,
					displayBar: false,
					height: "280px",
				},
			};
		case "revenue":
		case "expenses":
		case "profit":
		case "growth-rate":
			return {
				id: chartId,
				title,
				group: definition.group,
				plot: {
					data: [{ x: overviewMonths, y: makeSeries(12, 10, 60, chartId.length), type: "scatter", mode: "lines", fill: "tozeroy", color: "third", title }],
					showLegend: false,
					title,
					titleColor: "primary",
					titleFontSize: 16,
					displayBar: false,
					height: "280px",
				},
			};
		case "quarterly-sales-distribution":
			return {
				id: chartId,
				title,
				group: definition.group,
				plot: {
					data: [
						{ y: makeSeries(12, 20, 80, 1), type: "box", color: "primary", title: "Q1" },
						{ y: makeSeries(12, 25, 90, 3), type: "box", color: "secondary", title: "Q2" },
						{ y: makeSeries(12, 18, 86, 6), type: "box", color: "third", title: "Q3" },
					],
					showLegend: false,
					title,
					titleColor: "primary",
					titleFontSize: 16,
					displayBar: false,
					height: "300px",
				},
			};
		case "budget-vs-actual-spending":
			return {
				id: chartId,
				title,
				group: definition.group,
				plot: {
					data: [
						{ x: overviewMonths.slice(0, 6), y: makeSeries(6, 45, 96, 2), type: "bar", color: "primary", title: "Budget" },
						{ x: overviewMonths.slice(0, 6), y: makeSeries(6, 42, 104, 4), type: "bar", color: "secondary", title: "Actual" },
						{ x: overviewMonths.slice(0, 6), y: makeSeries(6, 48, 100, 6), type: "bar", color: "third", title: "Forecast" },
					],
					showLegend: true,
					title,
					titleColor: "primary",
					titleFontSize: 16,
					displayBar: false,
					height: "300px",
				},
			};
		case "performance-over-time":
			return {
				id: chartId,
				title,
				group: definition.group,
				plot: {
					data: [
						{ x: Array.from({ length: 20 }, (_, index) => index + 1), y: makeSeries(20, 40, 90, 1), type: "scatter", mode: "lines", color: "primary", title: "Projected" },
						{ x: Array.from({ length: 20 }, (_, index) => index + 1), y: makeSeries(20, 35, 86, 5), type: "scatter", mode: "lines", color: "secondary", title: "Actual" },
						{ x: Array.from({ length: 20 }, (_, index) => index + 1), y: makeSeries(20, 38, 78, 9), type: "scatter", mode: "lines", color: "third", title: "Historical Avg" },
					],
					showLegend: true,
					title,
					titleColor: "primary",
					titleFontSize: 16,
					displayBar: false,
					height: "300px",
				},
			};
		default:
			return { id: chartId, title, group: definition?.group || "Report", plot: makeSingleMetric(title, 1) };
	}
});

import { useState, useRef } from "react";
import {
	Grid, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow,
	Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { memo } from "react";

import { SecondaryBackgroundButton, SecondaryBorderButton, HighlightBackgroundButton } from "../components/Buttons.js";
import Spinner from "../components/Spinner.js";
import { useSnackbar } from "../utils/index.js";
import { importData } from "../api/index.js";

const useStyles = makeStyles((theme) => ({
	container: {
		padding: "20px",
		display: "flex",
		flexDirection: "column",
		gap: "20px",
	},
	dropzone: {
		border: `2px dashed ${theme.palette.secondary.main}`,
		borderRadius: "8px",
		padding: "40px",
		textAlign: "center",
		cursor: "pointer",
		transition: "all 0.3s ease",
		backgroundColor: theme.palette.mode === "dark" ? "#2a2a2a" : "#f5f5f5",
		"&:hover": {
			backgroundColor: theme.palette.mode === "dark" ? "#333" : "#f0f0f0",
			borderColor: theme.palette.third.main,
		},
		"&.drag-active": {
			backgroundColor: theme.palette.third.main,
			borderColor: theme.palette.third.main,
			opacity: 0.8,
		},
	},
	previewTable: {
		marginTop: "20px",
		overflowX: "auto",
	},
	errorRow: {
		backgroundColor: theme.palette.error.main,
		opacity: 0.3,
	},
	validRow: {
		backgroundColor: "transparent",
	},
	section: {
		marginTop: "20px",
		padding: "15px",
		backgroundColor: theme.palette.mode === "dark" ? "#1f1f1f" : "#fafafa",
		borderRadius: "8px",
	},
	buttonGroup: {
		display: "flex",
		gap: "10px",
		marginTop: "20px",
		justifyContent: "flex-start",
		flexWrap: "wrap",
	},
	summaryBox: {
		padding: "20px",
		backgroundColor: theme.palette.success.main,
		borderRadius: "8px",
		marginTop: "20px",
		color: "white",
	},
}));

const parseCSV = (text) => {
	const lines = text.trim().split("\n");
	if (lines.length === 0) return { headers: [], rows: [] };

	const headers = lines[0].split(",").map((h) => h.trim());
	const rows = lines.slice(1).map((line, index) => {
		const values = line.split(",").map((v) => v.trim());
		const row = {};
		headers.forEach((header, i) => {
			row[header] = values[i] || "";
		});
		return { ...row, _rowIndex: index + 1 };
	});

	return { headers, rows };
};

const validateRow = (row, headers) => {
	const errors = [];

	// Check for empty cells
	headers.forEach((header) => {
		if (!row[header] || row[header].trim() === "") {
			errors.push(`${header} is required`);
		}
	});

	return errors;
};

const Import = memo(() => {
	const classes = useStyles();
	const { error: showError, success: showSuccess } = useSnackbar();

	const [isDragActive, setIsDragActive] = useState(false);
	const [fileName, setFileName] = useState("");
	const [headers, setHeaders] = useState([]);
	const [rows, setRows] = useState([]);
	const [rowErrors, setRowErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [importSummary, setImportSummary] = useState(null);

	const fileInputRef = useRef(null);

	const handleFileSelect = (file) => {
		if (!file || !file.name.endsWith(".csv")) {
			showError("Please select a CSV file");
			return;
		}

		setFileName(file.name);
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const text = e.target.result;
				const { headers: parsedHeaders, rows: parsedRows } = parseCSV(text);

				if (parsedRows.length === 0) {
					showError("CSV file has no data rows");
					return;
				}

				setHeaders(parsedHeaders);
				setRows(parsedRows);

				// Validate all rows
				const errors = {};
				let hasErrors = false;
				parsedRows.forEach((row) => {
					const rowErrors = validateRow(row, parsedHeaders);
					if (rowErrors.length > 0) {
						errors[row._rowIndex] = rowErrors;
						hasErrors = true;
					}
				});

				setRowErrors(errors);

				if (hasErrors) {
					showError(`${Object.keys(errors).length} row(s) have validation errors`);
				} else {
					showSuccess("File loaded successfully - all rows are valid");
				}
			} catch (err) {
				showError("Failed to parse CSV file");
				console.error(err);
			}
		};

		reader.readAsText(file);
	};

	const handleDragEnter = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);

		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	const handleClickUpload = () => {
		fileInputRef.current?.click();
	};

	const handleFileInputChange = (e) => {
		const files = e.target.files;
		if (files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	const handleSubmitImport = async () => {
		if (rows.length === 0) {
			showError("No data to import");
			return;
		}

		if (Object.keys(rowErrors).length > 0) {
			showError("Cannot import - there are validation errors");
			return;
		}

		setIsLoading(true);

		try {
			const response = await importData(rows);

			if (response?.success) {
				setImportSummary({
					rowsInserted: response.rowsInserted || rows.length,
					rowsSkipped: response.rowsSkipped || 0,
					totalRows: rows.length,
				});
				showSuccess("Import completed successfully!");
			} else {
				showError(response?.message || "Import failed");
			}
		} catch (err) {
			showError("Import request failed");
			console.error(err);
		}

		setIsLoading(false);
	};

	const handleReset = () => {
		setFileName("");
		setHeaders([]);
		setRows([]);
		setRowErrors({});
		setImportSummary(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const errorRowIndices = Object.keys(rowErrors).map(Number);

	return (
		<div className={classes.container}>
			<Spinner open={isLoading} />

			{/* Header */}
			<Grid container>
				<Typography variant="h4" color="white.main" gutterBottom>
					Bulk Import
				</Typography>
			</Grid>

			{/* Upload Section */}
			{!importSummary && (
				<>
					<div
						id="import-dropzone"
						className={`${classes.dropzone} ${isDragActive ? "drag-active" : ""}`}
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						onClick={handleClickUpload}
						role="button"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleClickUpload();
							}
						}}
					>
						<input
							id="import-file-input"
							ref={fileInputRef}
							type="file"
							accept=".csv"
							style={{ display: "none" }}
							onChange={handleFileInputChange}
						/>
						<Typography variant="h6" color="white.main">
							Drag and drop your CSV file here
						</Typography>
						<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
							or click to browse
						</Typography>
					</div>

					{/* File Name Display */}
					{fileName && (
						<Box id="import-file-name" className={classes.section}>
							<Typography variant="subtitle1" color="white.main">
								<b>Selected File:</b> {fileName}
							</Typography>
						</Box>
					)}

					{/* Preview Table */}
					{rows.length > 0 && (
						<>
							<Box id="import-preview-table" className={classes.previewTable}>
								<Typography variant="h6" color="white.main" gutterBottom>
									Preview ({rows.length} rows)
								</Typography>
								<Table>
									<TableHead>
										<TableRow style={{ backgroundColor: "#333" }}>
											{headers.map((header) => (
												<TableCell key={header} style={{ color: "white", fontWeight: "bold" }}>
													{header}
												</TableCell>
											))}
										</TableRow>
									</TableHead>
									<TableBody>
										{rows.map((row) => {
											const rowIndex = row._rowIndex;
											const hasError = errorRowIndices.includes(rowIndex);
											return (
												<TableRow
													key={`row-${rowIndex}`}
													id={hasError ? `import-error-row-${rowIndex - 1}` : `import-preview-row-${rowIndex - 1}`}
													className={hasError ? classes.errorRow : classes.validRow}
												>
													{headers.map((header) => (
														<TableCell key={`cell-${rowIndex}-${header}`} style={{ color: "white" }}>
															{row[header]}
														</TableCell>
													))}
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</Box>

							{/* Error Message */}
							{Object.keys(rowErrors).length > 0 && (
								<Box id="import-error-message" className={classes.section} style={{ backgroundColor: "#d32f2f", opacity: 0.2 }}>
									<Typography variant="subtitle1" color="error.main">
										<b>Validation Errors:</b>
									</Typography>
									{Object.entries(rowErrors).map(([rowIndex, errors]) => (
										<Box key={`error-${rowIndex}`} sx={{ mt: 1 }}>
											<Typography variant="body2" color="error.main">
												<b>Row {rowIndex}:</b>
											</Typography>
											<ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
												{errors.map((err, idx) => (
													<li key={`err-${idx}`} style={{ color: "#ff5252" }}>
														{err}
													</li>
												))}
											</ul>
										</Box>
									))}
								</Box>
							)}

							{/* Action Buttons */}
							<div className={classes.buttonGroup}>
								<HighlightBackgroundButton
									id="import-submit"
									title="Confirm Import"
									disabled={Object.keys(rowErrors).length > 0}
									onClick={handleSubmitImport}
									width="auto"
								/>
								<SecondaryBorderButton
									id="import-cancel"
									title="Reset"
									onClick={handleReset}
									width="auto"
								/>
							</div>
						</>
					)}
				</>
			)}

			{/* Summary Section */}
			{importSummary && (
				<Box id="import-summary" className={classes.summaryBox}>
					<Typography variant="h5" gutterBottom>
						✓ Import Completed Successfully
					</Typography>
					<Typography variant="body1" sx={{ mt: 1 }}>
						<b>Rows Inserted:</b> {importSummary.rowsInserted}
					</Typography>
					<Typography variant="body1">
						<b>Rows Skipped:</b> {importSummary.rowsSkipped}
					</Typography>
					<Typography variant="body1">
						<b>Total Rows:</b> {importSummary.totalRows}
					</Typography>
					<div className={classes.buttonGroup}>
						<HighlightBackgroundButton
							title="Import Another File"
							onClick={handleReset}
							width="auto"
						/>
					</div>
				</Box>
			)}
		</div>
	);
});

Import.displayName = "Import";

export default Import;

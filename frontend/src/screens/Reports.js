import { useMemo, useState } from "react";
import { Box, Button, Checkbox, Divider, FormControlLabel, Grid, Paper, TextField, Typography } from "@mui/material";
import { Delete, LocalPrintshop, Visibility } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";

import Plot from "../components/Plot.js";
import useSnackbar from "../utils/use-snackbar.js";
import {
	REPORT_CHART_DEFINITIONS,
	createReportSnapshot,
	deleteReportById,
	getDefaultDateRange,
	getReportById,
	readReports,
	writeReports,
} from "../utils/reports.js";

const formatDisplayDate = (value) => {
	if (!value) return "-";
	return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
};

const buildReportDraft = ({ title, commentary, dateFrom, dateTo, selectedChartIds }) => {
	const defaults = getDefaultDateRange();
	const normalizedDateFrom = dateFrom || defaults.dateFrom;
	const normalizedDateTo = dateTo || defaults.dateTo;

	return {
		id: `rpt-${Date.now()}`,
		title: title.trim(),
		commentary: commentary.trim(),
		dateFrom: normalizedDateFrom,
		dateTo: normalizedDateTo,
		createdAt: new Date().toISOString(),
		chartIds: selectedChartIds,
		charts: createReportSnapshot(selectedChartIds),
	};
};

const ReportCharts = ({ report }) => (
	<Grid container spacing={2} className="report-chart-grid">
		{report.charts.map((chart) => (
			<Grid key={chart.id} item xs={12} md={6} className="report-chart-block">
				<Paper elevation={0} sx={{ p: 2, height: "100%", borderRadius: 1 }}>
					<Typography variant="overline" color="text.secondary">{chart.group}</Typography>
					<Typography variant="h6" color="primary.main" mb={1}>{chart.title}</Typography>
					<Plot {...chart.plot} background="white" />
				</Paper>
			</Grid>
		))}
	</Grid>
);

const Reports = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const snackbar = useSnackbar();
	const [reports, setReports] = useState(() => readReports());
	const [wizardOpen, setWizardOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [commentary, setCommentary] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [selectedChartIds, setSelectedChartIds] = useState([]);
	const [previewReport, setPreviewReport] = useState(null);

	const currentReport = useMemo(() => (id ? getReportById(id) : null), [id]);

	const resetWizard = () => {
		setWizardOpen(false);
		setTitle("");
		setCommentary("");
		setDateFrom("");
		setDateTo("");
		setSelectedChartIds([]);
		setPreviewReport(null);
	};

	const validateWizard = () => {
		if (!title.trim()) {
			snackbar.error("Add a report title.");
			return false;
		}

		if (selectedChartIds.length === 0) {
			snackbar.error("Select at least one chart.");
			return false;
		}

		return true;
	};

	const handleChartToggle = (chartId) => {
		setSelectedChartIds((current) => (
			current.includes(chartId)
				? current.filter((idValue) => idValue !== chartId)
				: [...current, chartId]
		));
	};

	const handlePreview = () => {
		if (!validateWizard()) return;
		setPreviewReport(buildReportDraft({ title, commentary, dateFrom, dateTo, selectedChartIds }));
	};

	const handleSave = () => {
		if (!validateWizard()) return;

		const report = buildReportDraft({ title, commentary, dateFrom, dateTo, selectedChartIds });
		const nextReports = [report, ...reports];
		writeReports(nextReports);
		setReports(nextReports);
		resetWizard();
		snackbar.success("Report saved.");
	};

	const handleDelete = (reportId) => {
		setReports(deleteReportById(reportId));
		snackbar.info("Report deleted.");
	};

	if (id) {
		return (
			<Box id="report-view-page" className="report-print-root" sx={{ py: 2, color: "text.primary" }}>
				<Box className="report-print-hidden" display="flex" justifyContent="space-between" alignItems="center" mb={2}>
					<Button variant="outlined" color="secondary" onClick={() => navigate("/reports")}>Back to reports</Button>
					<Button id="report-view-print" variant="contained" color="primary" startIcon={<LocalPrintshop />} onClick={() => window.print()}>
						Print
					</Button>
				</Box>
				{!currentReport && (
					<Paper elevation={0} sx={{ p: 4, borderRadius: 1 }}>
						<Typography variant="h4" color="primary.main" gutterBottom>Report not found</Typography>
						<Typography color="text.secondary">The saved report could not be found in this browser.</Typography>
					</Paper>
				)}
				{currentReport && (
					<Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 1 }}>
						<Typography variant="h4" color="primary.main">{currentReport.title}</Typography>
						<Typography color="text.secondary" mb={2}>
							{`Created ${formatDisplayDate(currentReport.createdAt)} | ${formatDisplayDate(currentReport.dateFrom)} - ${formatDisplayDate(currentReport.dateTo)}`}
						</Typography>
						{currentReport.commentary && (
							<Box mb={3}>
								<Typography variant="h6" color="primary.main">Commentary</Typography>
								<Typography whiteSpace="pre-wrap">{currentReport.commentary}</Typography>
							</Box>
						)}
						<ReportCharts report={currentReport} />
					</Paper>
				)}
			</Box>
		);
	}

	return (
		<Box id="reports-page" sx={{ py: 2, color: "white.main" }}>
			<Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap={2} mb={2}>
				<Box>
					<Typography variant="h4">Reports</Typography>
					<Typography color="white.main">Create static report snapshots from dashboard charts.</Typography>
				</Box>
				<Button id="reports-create-button" variant="contained" color="third" onClick={() => setWizardOpen(true)}>
					New Report
				</Button>
			</Box>

			<Grid container spacing={2}>
				<Grid item xs={12} lg={wizardOpen ? 5 : 12}>
					<Paper id="reports-list" elevation={0} sx={{ p: 2, borderRadius: 1 }}>
						<Typography variant="h6" color="primary.main" mb={1}>Saved reports</Typography>
						{reports.length === 0 && (
							<Box id="reports-empty" sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
								<Typography>No reports saved yet.</Typography>
							</Box>
						)}
						{reports.map((report) => (
							<Box key={report.id} id={`reports-item-${report.id}`} sx={{ py: 1.5 }}>
								<Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
									<Box>
										<Typography id={`reports-item-title-${report.id}`} variant="subtitle1" color="primary.main">{report.title}</Typography>
										<Typography id={`reports-item-date-${report.id}`} variant="body2" color="text.secondary">{formatDisplayDate(report.createdAt)}</Typography>
									</Box>
									<Box display="flex" gap={1}>
										<Button id={`reports-item-view-${report.id}`} size="small" variant="outlined" startIcon={<Visibility />} onClick={() => navigate(`/reports/${report.id}`)}>
											View
										</Button>
										<Button id={`reports-item-delete-${report.id}`} size="small" color="error" variant="outlined" startIcon={<Delete />} onClick={() => handleDelete(report.id)}>
											Delete
										</Button>
									</Box>
								</Box>
								<Divider sx={{ mt: 1.5 }} />
							</Box>
						))}
					</Paper>
				</Grid>

				{wizardOpen && (
					<Grid item xs={12} lg={7}>
						<Paper id="report-wizard" elevation={0} sx={{ p: 2, borderRadius: 1 }}>
							<Typography variant="h6" color="primary.main" mb={2}>New Report</Typography>
							<Grid container spacing={2}>
								<Grid item xs={12} md={6}>
									<TextField id="report-wizard-title" label="Report title" value={title} fullWidth onChange={(event) => setTitle(event.target.value)} />
								</Grid>
								<Grid item xs={12} md={3}>
									<TextField
										id="report-wizard-date-from"
										label="From"
										type="date"
										value={dateFrom}
										fullWidth
										InputLabelProps={{ shrink: true }}
										onChange={(event) => setDateFrom(event.target.value)}
									/>
								</Grid>
								<Grid item xs={12} md={3}>
									<TextField
										id="report-wizard-date-to"
										label="To"
										type="date"
										value={dateTo}
										fullWidth
										InputLabelProps={{ shrink: true }}
										onChange={(event) => setDateTo(event.target.value)}
									/>
								</Grid>
								<Grid item xs={12}>
									<TextField
										id="report-wizard-commentary"
										label="Commentary"
										value={commentary}
										multiline
										minRows={4}
										fullWidth
										onChange={(event) => setCommentary(event.target.value)}
									/>
								</Grid>
								<Grid item xs={12}>
									<Box id="report-wizard-chart-select" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 0.5 }}>
										{REPORT_CHART_DEFINITIONS.map((chart) => (
											<FormControlLabel
												key={chart.id}
												control={(
													<Checkbox
														id={`report-wizard-chart-option-${chart.id}`}
														checked={selectedChartIds.includes(chart.id)}
														onChange={() => handleChartToggle(chart.id)}
													/>
												)}
												label={`${chart.group}: ${chart.name}`}
											/>
										))}
									</Box>
								</Grid>
								<Grid item xs={12} display="flex" flexWrap="wrap" gap={1}>
									<Button id="report-wizard-preview" variant="outlined" color="primary" onClick={handlePreview}>Preview</Button>
									<Button id="report-wizard-save" variant="contained" color="primary" onClick={handleSave}>Save report</Button>
									<Button id="report-wizard-cancel" variant="text" color="secondary" onClick={resetWizard}>Cancel</Button>
								</Grid>
							</Grid>
							{previewReport && (
								<Box mt={3}>
									<Divider sx={{ mb: 2 }} />
									<Typography variant="h6" color="primary.main">Preview</Typography>
									<Typography color="text.secondary" mb={2}>
										{`${formatDisplayDate(previewReport.dateFrom)} - ${formatDisplayDate(previewReport.dateTo)}`}
									</Typography>
									{previewReport.commentary && (
										<Typography whiteSpace="pre-wrap" mb={2}>{previewReport.commentary}</Typography>
									)}
									<ReportCharts report={previewReport} />
								</Box>
							)}
						</Paper>
					</Grid>
				)}
			</Grid>
		</Box>
	);
};

export default Reports;

import Report from '../models/reports.model.js';

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({});
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

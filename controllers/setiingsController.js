const Settings = require('../models/settings');

// Get company name
exports.getCompanyName = async (req, res) => {
    try {
        const company = await Settings.findOne();
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.status(200).json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create or update company name
exports.updateCompanyName = async (req, res) => {
    const { companyName } = req.body;
    try {
        let company = await Settings.findOne();
        if (!company) {
            company = new Settings({ companyName });
            await company.save();
        } else {
            company.companyName = companyName;
            await company.save();
        }
        res.status(200).json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
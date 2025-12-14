let settings = {
  gstNumber: "",
  cutoffTime: "22:00"
};

export const getSettings = async (req, res) => {
  res.json(settings);
};

export const updateSettings = async (req, res) => {
  settings = { ...settings, ...req.body };
  res.json({ message: "Settings saved" });
};

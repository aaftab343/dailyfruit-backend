let announcement = "";

export const saveAnnouncement = async (req, res) => {
  announcement = req.body.text || "";
  res.json({ message: "Announcement saved" });
};

export const getAnnouncement = async (req, res) => {
  res.json({ text: announcement });
};

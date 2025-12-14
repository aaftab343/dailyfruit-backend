export const getInventory = async (req, res) => {
  try {
    // Static sample — replace with real stock later
    res.json([
      { name: "Apple", stock: 50, dailyUse: 30 },
      { name: "Banana", stock: 20, dailyUse: 25 },
      { name: "Papaya", stock: 10, dailyUse: 15 }
    ]);
  } catch (err) {
    res.status(500).json({ message: "Failed to load inventory" });
  }
};


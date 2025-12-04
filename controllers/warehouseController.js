import Warehouse from '../models/Warehouse.js';

export const adminListWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({}).sort({ createdAt: -1 });
    res.json(warehouses);
  } catch (err) {
    console.error('adminListWarehouses error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminCreateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json(warehouse);
  } catch (err) {
    console.error('adminCreateWarehouse error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByIdAndUpdate(id, req.body, { new: true });
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    res.json(warehouse);
  } catch (err) {
    console.error('adminUpdateWarehouse error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminToggleWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    warehouse.active = !warehouse.active;
    await warehouse.save();
    res.json(warehouse);
  } catch (err) {
    console.error('adminToggleWarehouse error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

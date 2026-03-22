import DailyGoal from '../models/goals.model.js';

export const getTodayGoals = async (req, res) => {
  try {
    const todayBegin = new Date();
    todayBegin.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const goals = await DailyGoal.find({
      user: req.user._id,
      date: {
        $gte: todayBegin,
        $lte: todayEnd
      }
    }).sort({ createdAt: 1 });
    
    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGoal = async (req, res) => {
  try {
    const { text } = req.body;
    const newGoal = new DailyGoal({
      user: req.user._id,
      text,
      date: new Date()
    });
    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await DailyGoal.findOne({ _id: id, user: req.user._id });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    goal.completed = !goal.completed;
    await goal.save();
    
    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DailyGoal.findOneAndDelete({ _id: id, user: req.user._id });
    
    if (!result) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

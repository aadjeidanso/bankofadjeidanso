const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccountActivitySchema = new Schema({
  accountType: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const AccountActivity = mongoose.model('AccountActivity', AccountActivitySchema);
module.exports = AccountActivity;

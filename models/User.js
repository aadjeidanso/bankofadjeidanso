const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
  type: { type: String, required: true },
  firstDeposit: { type: Number, required: true },
  accountNumber: { type: String, required: true },
  routingNumber: { type: String, required: true },
  activities: [{ type: Schema.Types.ObjectId, ref: 'AccountActivity' }]
});

const UserSchema = new Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  dob: { type: String, required: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  county: { type: String },
  phoneNumber: { type: String, required: true },
  emailAddress: { type: String, required: true, unique: true },
  ssn: { type: String, required: true },
  employmentStatus: { type: String, required: true },
  sourceOfIncome: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accounts: [accountSchema]
});

// Pre-save hook to ensure no more than 3 accounts
UserSchema.pre('save', function (next) {
    if (this.accounts.length > 3) {
        return next(new Error('A user can only have up to three accounts.'));
    }
    next();
});

const User = mongoose.model('User', UserSchema);
module.exports = User;

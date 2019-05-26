const mongoose = require('mongoose');

const cardSchema = mongoose.Schema({
	token:String,
	cardNumber:String,
});

module.exports = cardSchema;
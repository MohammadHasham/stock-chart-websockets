const mongoose = require('mongoose');
const { Schema } = mongoose;

const Stock = new Schema({
	stock: [
		{
			title: String,
			disabled: false,
			data: [
				{
					x: Number,
					y: Number
				}
			]
		}
	]
});
mongoose.model('stock', Stock);

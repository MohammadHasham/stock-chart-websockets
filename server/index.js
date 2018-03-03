const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

var socket = require('socket.io');
const app = express();

require('./models/stock');
mongoose.connect('mongodb://admin:admin@ds151508.mlab.com:51508/stock');
app.use(bodyParser.json());

var server = app.listen(process.env.PORT || 5000, () => {
	console.log('server running on 5000');
});
const Stock = mongoose.model('stock');

/**Routes **/
app.get('/api/getStock', (req, res) => {
	Stock.find({}, (err, response) => {
		res.send(response);
	});
});

io = socket(server);

io.on('connection', socket => {
	console.log(socket.id);

	socket.on('/api/addStock', data => {
		console.log(data.info);

		let obj = {
			title: data.info.title,
			disabled: false,
			data: [
				{
					x: data.info.data[0].x,
					y: data.info.data[0].y
				}
			]
		};

		Stock.find({ 'stock.title': data.info.title }, (err, response) => {
			if (response.length == 0) {
				Stock.collection.findOneAndUpdate(
					{},
					{ $push: { stock: obj } },
					{ upsert: true, new: true, setDefaultsOnInsert: true },
					(err, response) => {}
				);
			}
		});
		io.emit('update', obj);
	});

	socket.on('/api/removeEntry', data => {
		Stock.update(
			{},
			{ $pull: { stock: { title: data.title } } },
			{ safe: true, multi: true },
			(err, response) => {
				console.log(err);
			}
		);
		io.emit('delete', 'nothing');
	});
});

/**Routes**/

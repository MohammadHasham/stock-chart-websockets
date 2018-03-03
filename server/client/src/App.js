import React, { Component } from 'react';
import {
	XAxis,
	YAxis,
	HorizontalGridLines,
	FlexibleWidthXYPlot,
	LineSeries,
	DiscreteColorLegend
} from 'react-vis';
import './App.css';
import axios from 'axios';
import yahooFinance from 'yahoo-finance';
import Highlight from './highlight';
import io from 'socket.io-client';
import icons from 'glyphicons';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

const totalValues = 100;

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			lastDrawLocation: null,
			series: [],
			text: ''
		};
		this.socket = io('localhost:5000');

		this.socket.on('update', function(data) {
			console.log('hello updates');
			addStock(data);
		});
		const addStock = data => {
			this.setState({ series: [...this.state.series, data] });
		};

		this.socket.on('delete', function(data) {
			console.log('delete');
			deleteStock(data);
		});
		const deleteStock = data => {
			axios.get('/api/getStock').then(response => {
				this.setState({ series: response.data[0].stock });
			});
		};
	}

	componentDidMount() {
		//make a call to db here so that the state is prepopulated with some data.
		axios.get('/api/getStock').then(response => {
			this.setState({ series: response.data[0].stock });
		});
	}
	getRandomSeriesData() {
		let result = [];
		axios
			.get(
				`https://www.quandl.com/api/v3/datasets/WIKI/${
					this.state.text
				}/data.json?api_key=_XrQGi79VUPAes3MzZCW`
			)
			.then(response => {
				result.push({
					x: response.data.dataset_data.data[0][2],
					y: response.data.dataset_data.data[0][3]
				});
				this.setState(
					{
						series: [
							...this.state.series,
							{
								title: this.state.text,
								disabled: false,
								data: result
							}
						]
					},
					() => {
						this.socket.emit('/api/addStock', {
							info: { title: this.state.text, disabled: false, data: result }
						});
					}
				);
			});
		return result;
	}

	onSubmit = () => {
		var result = this.getRandomSeriesData();
	};
	removeEntry = entry => {
		console.log(entry);
		this.socket.emit('/api/removeEntry', {
			title: entry.title
		});
	};
	renderItems = () => {
		return this.state.series.map(entry => {
			return (
				<div className="col-md-4">
					<button onClick={() => this.removeEntry(entry)} class="btn btn-info ">
						<h3>
							{entry.title}
							{icons.crossHeavy}
						</h3>
					</button>
				</div>
			);
		});
	};
	render() {
		const { series, lastDrawLocation } = this.state;
		return (
			<div className="container">
				<h1 className="text-center">Stock Chart</h1>
				<div className="example-with-click-me">
					<div className="legend">
						<DiscreteColorLegend width={180} items={series} />
					</div>

					<div className="chart no-select">
						<FlexibleWidthXYPlot
							animation
							xDomain={
								lastDrawLocation && [
									lastDrawLocation.left,
									lastDrawLocation.right
								]
							}
							height={300}>
							<HorizontalGridLines />

							<YAxis />
							<XAxis />

							{series.map(entry => (
								<LineSeries key={entry.title} data={entry.data} />
							))}

							<Highlight
								onBrushEnd={area => {
									this.setState({
										lastDrawLocation: area
									});
								}}
							/>
						</FlexibleWidthXYPlot>
					</div>

					<button
						className="showcase-button"
						onClick={() => {
							this.setState({ lastDrawLocation: null });
						}}>
						Reset Zoom
					</button>

					<div>
						{lastDrawLocation ? (
							<ul style={{ listStyle: 'none' }}>
								<li>
									<b>Top:</b> {lastDrawLocation.top}
								</li>
								<li>
									<b>Right:</b> {lastDrawLocation.right}
								</li>
								<li>
									<b>Bottom:</b> {lastDrawLocation.bottom}
								</li>
								<li>
									<b>Left:</b> {lastDrawLocation.left}
								</li>
							</ul>
						) : (
							<span>N/A</span>
						)}
					</div>
					<div className="jumbotron">
						<div className="row">
							<div className="col-md-4" />
							<div className="col-md-5">
								<input
									type="text"
									onChange={e => this.setState({ text: e.target.value })}
									className="form-control inline mb-2 mr-sm-2 mb-sm-0"
									value={this.state.text}
								/>

								<button
									style={{ margin: '1% 0% 0% 40%' }}
									className="btn btn-primary"
									onClick={this.onSubmit}>
									Submit
								</button>
							</div>
							<div className="col-md-3" />
						</div>
						<div className="row" style={{ marginTop: '7%' }}>
							{this.renderItems()}
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default App;

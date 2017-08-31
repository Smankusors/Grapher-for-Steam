$(document).ready(function() {
	var firstDate = $('.wallet_table_row .wht_date').first().text();
	if (moment(firstDate, "DD MMM YYYY").isValid() === false) {
		var locale = window.navigator.userLanguage || window.navigator.language;
		moment.locale(locale);
	}
	$('.page_header_ctn .page_content').append("<button class=\"btnv6_blue_hoverfade btn_medium\" type=\"button\" id=\"grapher\" style=\"float:right;padding:10px;margin-top:-35px\">Graph this</button>");
	$('.page_header_ctn .page_content').append("<button class=\"btnv6_blue_hoverfade btn_medium\" type=\"button\" id=\"backToList\" style=\"float:left;padding:10px;margin-top:-35px; margin-left:-85px;width:70px\">&lt; Back</button>");$('.page_header_ctn .page_content').append("<select class=\"gray_bevel dyninput\" id=\"combinedRangeSelect\" style=\"float:right;margin-top:-25px;background-color:#29577e;width:100px;border:none;padding:5px\"><option>Monthly</option><option>Quarterly</option><option selected=\"true\">Yearly</option></select>");
	$('#combinedRangeSelect').hide();
	$('#backToList').hide();
	$('#grapher').click(function() {
		$('#grapher').text("Loading...");
		if ($('#load_more_button').is(':visible')) {
			var historyScript = $('script').last().html();
			$('script').last().remove();
			var historyBefore = historyScript.substring(0, historyScript.indexOf('if ( data.cur'));
			var historyAfter = historyScript.substring(historyScript.indexOf('if ( data.cur'));
			$('body').append('<script>' + historyBefore + 'window.postMessage({type:"moreHistory",text:"done."},"*");\n' + historyAfter + '</script>');
			$('body').append('<script>WalletHistory_LoadMore()</script>');
		} else
			TransitionToChart();
	});
	$('#backToList').click(function() {
		$('#grapher').text("Graph This");
		$('#steamGraph').fadeOut(300);
		$('#combinedRangeSelect').fadeOut(300);
		$('#backToList').fadeOut(300);
		window.setTimeout(function(){
			$('#grapher').fadeIn(300);
			$('.wallet_history_table').fadeIn(300);
			$('.wallet_history_click_hint').fadeIn(300);
		}, 300);
	});
});

window.addEventListener("message", function(event) {
	if (event.source != window)
		return;
	if (event.data.type && (event.data.type == "moreHistory")) {
		TransitionToChart();
	}
}, false);

var initialized = false;
function TransitionToChart() {
	$('#grapher').fadeOut(300);
	$('.wallet_history_table').fadeOut(300);
	$('.wallet_history_click_hint').fadeOut(300);
	$('.load_more_history_area').remove();
	if (!initialized)
		$('#main_content').append('<div id="steamGraph"><canvas id="transactionChart" style="width:100%;height:400px;" /><br /><canvas id="balanceChart" style="width:100%;height:400px;" /></div>');
	$('#steamGraph').hide();
	window.setTimeout(function(){
		$('#steamGraph').fadeIn(300);
		$('#combinedRangeSelect').fadeIn(300);
		$('#backToList').fadeIn(300);
		$('#combinedRangeSelect').change(function () {
			var selected = $('option:selected').text();
			if (selected === "Yearly") ShowYearly();
			else if (selected === "Quarterly") ShowQuarterly();
			else if (selected === "Monthly") ShowMonthly();
		});
		if (!initialized) {
			LoadTransactions();
			InitializeChart();
			ShowYearly();
		}
	}, 300);
}

var transactions;
var transConfig;
var balanceConfig;
function InitializeChart() {
	var lastWalletBalance = $('.wallet_table_row .wht_wallet_balance').first().text().replace(/\s/g, "");
	var walletPrefix = "", walletSuffix = "";
	for (var i = 0; i < lastWalletBalance.length; i++) {
		if (lastWalletBalance[i] % 1 === 0) {
			walletPrefix = lastWalletBalance.substring(0, i);
			break;
		}
	}
	walletPrefix += " ";
	for (var i = lastWalletBalance.length - 1; i >= 0; i--) {
		if (lastWalletBalance[i] % 1 === 0) {
			walletSuffix = lastWalletBalance.substring(i + 1);
			break;
		}
	}
	walletSuffix = " " + walletSuffix;
	Chart.defaults.global.defaultFontColor = 'white';
	Chart.defaults.global.defaultColor = 'rgba(255, 255, 255, 0.1)';
	Chart.defaults.bar.scales.xAxes[0].categorySpacing = 0;
	var color = Chart.helpers.color;
	var transCtx = document.getElementById("transactionChart").getContext('2d');
	var balanceCtx = document.getElementById("balanceChart").getContext('2d');
	transConfig = {
		type: 'bar',
		data: {
			labels: [],
			datasets: [{
				type: 'line',
				label: 'Profit',
				backgroundColor: 'rgb(0, 255, 0)',
				borderColor: 'rgb(0, 255, 0)',
				fill: false,
				data: []
			}, {
				type: 'bar',
				label: 'Spending',
				backgroundColor: 'rgb(229, 65, 40)',
				borderColor: 'rgb(229, 65, 40)',
				data: []
			}, {
				type: 'bar',
				label: 'Income',
				backgroundColor: 'rgb(1, 172, 241)',
				borderColor: 'rgb(1, 172, 241)',
				data: []
			}]
		},
		options: {
			title: {
				text: "Transaction Graph",
				display: true,
				fontSize: 16
			},
			scales: {
				xAxes: [{
					stacked: true,
					type: "time",
					display: true,
					barPercentage: 0.4,
					time: {
						unit: 'year'
					}
				}],
				yAxes: [{
					ticks: {
						callback: function(value, index, values) {
							if (value >= 0)
								return walletPrefix + value + walletSuffix;
							else
								return "-" + walletPrefix + (0 - value) + walletSuffix;
						}
					}
				}]
			}
		}
	};
	balanceConfig = {
		type: 'line',
		data: {
			labels: [],
			datasets: [{
				type: 'line',
				label: 'Wallet Balance',
				backgroundColor: 'rgba(0, 255, 0, 0.25)',
				borderColor: 'rgba(0, 255, 0, 0.5)',
				fill: true,
				data: []
			}]
		},
		options: {
			title: {
				text: "Steam Wallet Graph",
				display: true,
				fontSize: 16
			},
			scales: {
				xAxes: [{
					type: "time",
					display: true,
					time: {
						unit: 'year'
					}
				}],
				yAxes: [{
					ticks: {
						callback: function(value, index, values) {
							if (value >= 0)
								return walletPrefix + value + walletSuffix;
							else
								return "-" + walletPrefix + (0 - value) + walletSuffix;
						}
					}
				}]
			}
		}
	};
	window.transChart = new Chart(transCtx, transConfig);
	window.balanceChart = new Chart(balanceCtx, balanceConfig);	
	var tooltipsLabel = function(tooltipItem, data) {
		var wallet = "";
		var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
		if (value >= 0)
			wallet = walletPrefix + value + walletSuffix;
		else
			wallet = "-" + walletPrefix + (0 - value) + walletSuffix;
		return data.datasets[tooltipItem.datasetIndex].label + " : " + wallet;
	}
	transConfig.options.tooltips.callbacks.label = tooltipsLabel;
	balanceConfig.options.tooltips.callbacks.label = tooltipsLabel;
	initialized = true;
}

function LoadTransactions() {
	transactions = [];
	$(".wallet_table_row").each(function() {
		var wallet_balance = $(this).find('.wht_wallet_balance').text().replace(/\s/g, "").replace(',', '.');
		for (var i = 1; i < wallet_balance.length; i++) {
			if (wallet_balance[i] % 1 === 0) {
				wallet_balance = parseFloat(wallet_balance.substring(i));
				break;
			}
		}
		var row = {
			date: $(this).find('.wht_date').text(),
			change: $(this).find('.wht_wallet_change').text().replace(/\s/g, "").replace(',', '.'),
			balance: wallet_balance
		};
		transactions.push(row);
	});
}

function UpdateChart(history, format) {
	transConfig.data.labels = [];
	balanceConfig.data.labels = [];
	transConfig.data.datasets[0].data = [];
	transConfig.data.datasets[1].data = [];
	transConfig.data.datasets[2].data = [];
	balanceConfig.data.datasets[0].data = [];
	var tooltipsTitle = function(tooltipItems, data) {
		return moment(tooltipItems[0].xLabel).format(format);
	};
	transConfig.options.tooltips.callbacks.title = tooltipsTitle;
	balanceConfig.options.tooltips.callbacks.title = tooltipsTitle;
	history.forEach(function(item) {
		var dateFormat = moment(item.year, "YYYY").add(item.month, 'months');
		transConfig.data.labels.push(dateFormat);
		balanceConfig.data.labels.push(dateFormat);
		transConfig.data.datasets[1].data.push((0 - item.spending).toFixed(2));
		transConfig.data.datasets[2].data.push(item.income.toFixed(2));
		transConfig.data.datasets[0].data.push((item.income - item.spending).toFixed(2));
		balanceConfig.data.datasets[0].data.push(item.balance);
	});
	window.transChart.update();
	window.balanceChart.update();
}

function ShowYearly() {
	var history = [];
	var beginDate = moment(transactions[transactions.length - 1].date, "DD MMM, YYYY").startOf('year');
	var toDate = moment(transactions[0].date, "DD MMM, YYYY").startOf('year');
	transConfig.options.scales.xAxes[0].time.min = beginDate;
	transConfig.options.scales.xAxes[0].time.max = toDate;
	balanceConfig.options.scales.xAxes[0].time.min = beginDate;
	balanceConfig.options.scales.xAxes[0].time.max = toDate;
	transConfig.options.scales.xAxes[0].time.unit = "year";
	balanceConfig.options.scales.xAxes[0].time.unit = "year";
	for (var i = transactions.length - 1; i >= 0; i--) {
		var year = moment(transactions[i].date, "DD MMM, YYYY").year();
		if (history[year] === undefined)
			history[year] = {year:year,month:0,spending:0.0,income:0.0,balance:0.0};
		if (transactions[i].change[0] === "+") {
			for (var j = 2; j < transactions[i].change.length; j++) {
				if (transactions[i].change.substring(j, j + 1) % 1 === 0) {
					history[year].income += parseFloat(transactions[i].change.substring(j));
					break;
				}
			}
		} else {
			for (var j = 2; j < transactions[i].change.length; j++) {
				if (transactions[i].change.substring(j, j + 1) % 1 === 0) {
					history[year].spending += parseFloat(transactions[i].change.substring(j));
					break;
				}
			}
		}
		history[year].balance = transactions[i].balance;
	}
	UpdateChart(history, "YYYY");
}

function ShowMonthly() {
	var history = [];
	var beginDate = moment(transactions[transactions.length - 1].date, "DD MMM, YYYY").startOf('month');
	var toDate = moment(transactions[0].date, "DD MMM, YYYY").startOf('month');
	transConfig.options.scales.xAxes[0].time.min = beginDate;
	transConfig.options.scales.xAxes[0].time.max = toDate;
	balanceConfig.options.scales.xAxes[0].time.min = beginDate;
	balanceConfig.options.scales.xAxes[0].time.max = toDate;
	transConfig.options.scales.xAxes[0].time.unit = "month";
	balanceConfig.options.scales.xAxes[0].time.unit = "month";
	for (var i = transactions.length - 1; i >= 0; i--) {
		var month = moment(transactions[i].date, "DD MMM, YYYY").month();
		var year = moment(transactions[i].date, "DD MMM, YYYY").year();
		var historyIndex = month + (year - beginDate.year()) * 12;
		if (history[historyIndex] === undefined)
			history[historyIndex] = {year:year,month:month,spending:0.0,income:0.0,balance:0.0};
		if (transactions[i].change[0] === "+") {
			for (var j = 1; j < transactions[i].change.length; j++) {
				if (transactions[i].change.substring(j, j + 1) % 1 === 0) {
					history[historyIndex].income += parseFloat(transactions[i].change.substring(j));
					break;
				}
			}
		} else {
			for (var j = 1; j < transactions[i].change.length; j++) {
				if (transactions[i].change.substring(j, j + 1) % 1 === 0) {
					history[historyIndex].spending += parseFloat(transactions[i].change.substring(j));
					break;
				}
			}
		}
		if (transactions[i].balance !== "")
			history[historyIndex].balance = transactions[i].balance;
	}
	UpdateChart(history, "MMMM YYYY");
}

function ShowQuarterly() {
	var history = [];
	var beginDate = moment(transactions[transactions.length - 1].date, "DD MMM, YYYY").startOf('quarter');
	var toDate = moment(transactions[0].date, "DD MMM, YYYY").startOf('quarter');
	transConfig.options.scales.xAxes[0].time.min = beginDate;
	transConfig.options.scales.xAxes[0].time.max = toDate;
	balanceConfig.options.scales.xAxes[0].time.min = beginDate;
	balanceConfig.options.scales.xAxes[0].time.max = toDate;
	transConfig.options.scales.xAxes[0].time.unit = 'quarter';
	balanceConfig.options.scales.xAxes[0].time.unit = 'quarter';
	for (var i = transactions.length - 1; i >= 0; i--) {
		var quarter = moment(transactions[i].date, "DD MMM, YYYY").quarter();
		var year = moment(transactions[i].date, "DD MMM, YYYY").year();
		var historyIndex = quarter + (year - beginDate.year()) * 4;
		if (history[historyIndex] === undefined)
			history[historyIndex] = {year:year,month:(quarter-1)*3,spending:0.0,income:0.0,balance:0.0};
		if (transactions[i].change[0] === "+") {
			for (var j = 2; j < transactions[i].change.length; j++) {
				if (transactions[i].change.substring(j, j + 1) % 1 === 0) {
					history[historyIndex].income += parseFloat(transactions[i].change.substring(j));
					break;
				}
			}
		} else {
			for (var j = 2; j < transactions[i].change.length; j++) {
				if (transactions[i].change.substring(j, j + 1) % 1 === 0) {
					history[historyIndex].spending += parseFloat(transactions[i].change.substring(j));
					break;
				}
			}
		}
		if (transactions[i].balance !== "")
			history[historyIndex].balance = transactions[i].balance;
	}
	UpdateChart(history, "[Q]Q - YYYY");
}

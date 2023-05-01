let tbl = null;
let activeRow = 0;
const Settings = Backbone.Model.extend({
	defaults: {
		activeRow: 0
	},
	initialize(options) {
		activeRow = options.activeRow;
		this.on('change', () => {
			GM_setValue('settings', JSON.stringify(this.toJSON()));
		});
		this.on('change:activeRow', function() {
			activeRow = this.get('activeRow');
		});
	}
});
let settings = new Settings(JSON.parse(GM_getValue('settings', '{}')));
const Row = Backbone.Model.extend({
	/*
	defaults: {
		active: false,
	},
	*/
	fillUp() {
		jQuery('.tabulator-table .tabulator-row.active-row').not(':last').removeClass('active-row');
		// jQuery(tbl.getRow(this.get('email')).getElement()).addClass('active-row');
		tbl.redraw(true);
		setNativeValue(document.querySelector('input[name="email"][data-bdd="email-address-field"]'), this.get('email'));
		setNativeValue(document.querySelector('input[name="password"][data-bdd="password-field"]'), this.get('password'));
		setNativeValue(document.querySelector('input[name="firstName"][data-bdd="first-name-field"]'), this.get('fName'));
		setNativeValue(document.querySelector('input[name="lastName"][data-bdd="last-name-field"]'), this.get('lName'));
	}
});
const DataRows = Backbone.Collection.extend({
	modelId: attrs => attrs.email,
	model: Row,
	getCurrent() {
		if( this.models.length )
			return this.models[activeRow - 1];
		else
			return false;
	},
	fillCurrentOne() {		
		if( activeRow < this.models.length ) {
			++activeRow;
			settings.set({activeRow});
			this.getCurrent().fillUp();
		} else
			alert('Reached the end of CSV file');
		
		return activeRow;
	}
});
let data = new DataRows(GM_getValue('data', []));
console.log(settings.toJSON());

(function() {
		'use strict';

		// Toolbar
		jQuery('body').append(GM_getResourceText('wrapperTpl'));
		$(document).arrive('[name="phoneNumber"][data-bdd="bind-phone.phone.label"]', function() {
			if( data.getCurrent() ) {
				setNativeValue(this, data.getCurrent().get('phone'));
			}
		});
		// Main
		jQuery(document).ready(function(event) {
			jQuery('#loadFile').click(function() {				
				tbl.import('csv', '*.csv').then(function() {
					console.log('Import Complete!');
					
					GM_setValue('data', tbl.getData());
					jQuery('.tabulator-table .tabulator-row.active-row').removeClass('active-row');
					jQuery('.tabulator-table .tabulator-row:first').addClass('active-row');
					settings.set('activeRow', 0);
				}).catch(e => {
					console.error(e);
				});
			});
			jQuery('#fillBtn').click(function(event) {
				data.fillCurrentOne();
			});
			tbl = new Tabulator('.tblWrapper', {
				index: 'email',
				layout: 'fitColumns',
				autoTables: true,
				columns: [
					{
						title: 'Email', field: 'email',
						contextMenu: function(event, cell) {
							return [{
								label: 'Fill Form',
								action: () => {
									data.models[cell.getRow().getPosition(true) - 1].fillUp();
								}
							}]
						},
					},
					{
						title: 'Password', field: 'password'
					},
					{
						title: 'First Name', field: 'fName'
					},
					{
						title: 'Last Name', field: 'lName'
					},
					{
						title: 'Phone Number', field: 'phone'
					},
				],
				rowFormatter(row) {
					let data = row.getData();
					
					if ( activeRow == row.getPosition(true) )
						jQuery(row.getElement()).addClass('active-row');
				}
			});
			
			jQuery('#collapseTbl').on('show.bs.collapse', function() {
				console.log('Re-Render table');
				// tbl.redraw(true);
				jQuery('.tabulator-table .tabulator-row.active-row').not(':last').removeClass('active-row');
			});
			tbl.on('renderComplete', () => {				
				jQuery('.tabulator-table .tabulator-row.active-row').not(':last').removeClass('active-row');
			});
			tbl.on('tableBuilt', () => {
				if( data.length ) {
					tbl.setData(data.toJSON());
				}
			});
		});
})();

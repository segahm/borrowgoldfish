'use strict';

var config = {

	english: {
		cities_home: 'Restaurants, Cities',
		restaurants: 'Restaurants',
		counties_home: 'Restaurants, Counties',
		shortDescription: function(title,valuation,county){
			return 'How much exactly is '+title+' restaurant worth? We estimate it at $'+valuation+'. Starting with market analysis of '+county+' county we use company-specific data to narrow down the competitive advantages of every restaurant in America.';
		},
		page: {
			company: {page_title: 'How much is my business worth?'},
			directory: {page_title: 'Small Business Finances and Valuation in'},
			index: {page_title: 'Borrow Goldfish: small business finances and valuation'}
		},
		all_pages: {
			twitter_share_text: encodeURIComponent('I might be running a #smallbiz, but my numbers speak for themselves'),
			encoded_meta_description: encodeURIComponent('We perform business valuation analysis on thousands of small businesses. Learn how your company is valued. Learn about restaurant business valuation.'),
			meta_description: 'We perform business valuation analysis on thousands of small businesses. Learn how your company is valued. Learn about restaurant business valuation.'
		},
	},
	spanish: {
		cities_home: 'Los restaurantes, Ciudades',
		restaurants: 'Los restaurantes',
		counties_home: 'Los restaurantes, Condados',
		//!!!!!!!!! TO BE CORRECTED
		shortDescription: function(title,valuation,county){
			return 'How much exactly is '+title+' restaurant worth? We estimate it at $'+valuation+'. Starting with market analysis of '+county+' county we use company-specific data to narrow down the competitive advantages of every restaurant in America.';
		},
		//!!!!!!! TO BE CORRECTED
		page: {
			company: {page_title: '¿Cuál es el valor de mi empresa?'},
			directory: {page_title: 'Finanzas para pequeñas empresas y de valoración en'},
			index: {page_title: 'Borrow Goldfish: las finanzas de pequeñas empresas y la valoración'}
		},
		all_pages: {
			twitter_share_text: encodeURIComponent('I might be running a #smallbiz, but my numbers speak for themselves'),
			encoded_meta_description: encodeURIComponent('We perform business valuation analysis on thousands of small businesses. Learn how your company is valued. Learn about restaurant business valuation.'),
			meta_description: 'We perform business valuation analysis on thousands of small businesses. Learn how your company is valued. Learn about restaurant business valuation.'
		},
	}
};

module.exports = config;
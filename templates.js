'use strict';

var config = {

	english: {
		cities_home: 'Restaurants, Cities',
		restaurants: 'Restaurants',
		counties_home: 'Restaurants, Counties',
		shortDescription: function(title,valuation,county){
			return 'How much exactly is '+(title.match(/Restaurant/i)?title:title+' restaurant')+' worth? We estimate it at $'+valuation+'. Starting with market analysis of '+county+' county we use company-specific data to narrow down the competitive advantages of every restaurant in America.';
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
		cities_home: 'Restaurantes, Ciudades',
		restaurants: 'Restaurantes',
		counties_home: 'Restaurantes, Condados',
		shortDescription: function(title,valuation,county){
			return '¿Cuánto exactamente '+(title.match(/Restaurant|restaurante/i)?title:title+' restaurante')+'? Lo estimamos a $'+valuation+'. A partir de analisis del mercado '+county+'  condado utilizamos datos especificos de las empresas para restringir las ventajas competitivas de cada restaurante en los Estados Unidos.';
		},
		page: {
			company: {page_title: '¿Cuánto exactamente vale mi empresa?'},
			directory: {page_title: 'Finanzas de las pequeñas empresas y la valoración en'},
			index: {page_title: 'Borrow Goldfish: Finanzas de las pequeñas empresas y la valoración'}
		},
		all_pages: {
			twitter_share_text: encodeURIComponent('Yo podría ejecutarse una #PYMES, pero mis números hablan por sí mismos'),
			encoded_meta_description: encodeURIComponent('Realizamos análisis de valuación de negocios en miles de pequeñas empresas. Aprenda cómo su empresa se valora. Aprender sobre valoración de empresas de restaurante.'),
			meta_description: 'Realizamos análisis de valuación de negocios en miles de pequeñas empresas. Aprenda cómo su empresa se valora. Aprender sobre la valoración de empresas en la restauración.'
		},
	}
};

module.exports = config;
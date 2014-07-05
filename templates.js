'use strict';

var config = {
	dev: {
		google_key: 'AIzaSyCX-UwGgMl4HbsxHEdJkdhccBagaH6yklQ',
		is_dev: true
	},
	production: {
		google_key: 'AIzaSyCY43D3JjW05XCs4DBGiAhpaTbjUpkR2sQ',
		is_dev: false
	},
	english: {
		cities_home: 'Restaurants, Cities',
		restaurants: 'Restaurants',
		counties_home: 'Restaurants, Counties',
		shortDescription: function(title,valuation,county){
			return 'How much exactly is '+(title.match(/Restaurant|restaurante/i)?title:title+' restaurant')+' worth? We estimate it at $'+valuation+'. Starting with market analysis of '+county+' county we use company-specific data to narrow down the competitive advantages of every restaurant in America.';
		},
		twitter: function(title,valuation,county,handle){
			if (typeof(handle) !== 'undefined'){
				return '@'+handle+' estimated at $'+valuation;
			}else{
				return '';
				//(title.match(/Resta/i)?title:title+' restaurant')+' from '+county+' county at $'+valuation;
			}
		},
		page: {
			company: {page_title: 'How much is my business worth?',
						points_3: {
							learn: 'Discover Opportunities',
							calculator: 'Simplify Financing',
							sell: 'Receive Offers'
						},
						target_audience: 'Own a restaurant business?',
						learn_more: 'Learn More',
						val_text: 'Business valuation',
						analysis: ['Perform competitor analysis',
						'Review available data',
						'Explore immediate opportunities'],
						detail_analysis: 'Detailed Business Analysis',
						claim: 'Claim to manage your company page',
						review: 'Review Available Financing',
						is_closed_title: '- Closed or Moved. Confirm here...',
						charts:[
							{title:'Performance Relative to Peers',hAxis: 'Peer relative ranking [0-5]',
								metric: 'Relative Placement'},
							{title:'Popularity of cuisine'},
							{title: 'Restaurant Density by County'},
							{title:'Operating density in counties by hours of the day'}]
					},
			directory: {page_title: 'Small Business Finances and Valuation in'},
			index: {page_title: 'Caura | Directory of restaurants and their financial profiles',
					page_description: 'Find thousands of restaurants, information about their finances and cash flow health. Explore a valuation estimate for restaurants in Texas, Florida, and New Mexico.'
				},
			search: {page_title: 'Caura | Financial services for independent restaurants',
					three_points: ['Competitive Analytics','Food Cost','Inventory Management']},
			about: {page_title: 'About Us - why focus on small business & lending?'},
			privacy: {page_title: 'Privacy - why make data public?'}

		},
		all_pages: {
			twitter_share_text: encodeURIComponent('#smallbiz #insight'),
			encoded_meta_description: encodeURIComponent('How much is a restaurant worth? Find out here...'),
			meta_description: 'How much is a restaurant worth? Find out here...'
		},
	},
	spanish: {
		cities_home: 'Restaurantes, Ciudades',
		restaurants: 'Restaurantes',
		counties_home: 'Restaurantes, Condados',
		shortDescription: function(title,valuation,county){
			return '¿Cuánto exactamente '+(title.match(/Restaurant|restaurante/i)?title:title+' restaurante')+'? Lo estimamos a $'+valuation+'. A partir de analisis del mercado '+county+'  condado utilizamos datos especificos de las empresas para restringir las ventajas competitivas de cada restaurante en los Estados Unidos.';
		},
		twitter: function(title,valuation,county,handle){
			if (typeof(handle) !== 'undefined'){
				return '@'+handle+' Lo estimamos a $'+valuation;
			}else{
				return 'Estimamos el restaurante';
				//'¿Cuánto exactamente '+(title.match(/Restaurant|restaurante/i)?title:title+' restaurante')+'? Lo estimamos a $'+valuation;
			}
		},
		page: {
			company: {page_title: '¿Cuánto exactamente vale mi empresa?',
						points_3: {
							learn: 'Descubra Oportunidades',
							calculator: 'Simplifique Financiación',
							sell: 'Acceso a las Ofertas'
						},
						target_audience: 'Poseer un negocio de restaurante?',
						learn_more: 'aprender más',
						val_text: 'Valoración de empresas',
						analysis: ['Realizar análisis de la competencia',
						'Artículos disponibles datos',
						'Explorar las oportunidades inmediatas'],
						detail_analysis: 'Análisis de Negocios detallado',
						claim: 'Reivindicación de administrar su página de la empresa',
						review: 'Artículos disponibles de financiamiento',
						is_closed_title: '- está cerrado o movido. confirme aquí',
						charts:[
							{title:'Representación Relativa',hAxis: 'Peer clasificación relativa [0-5]',
								metric: 'Relative Placement'},
							{title:'La popularidad de la cocina'},
							{title:'Restaurante Densidad por el Condado'},
							{title:'Densidad de operación en los condados por hora del día'}]
			},
			directory: {page_title: 'Finanzas de las pequeñas empresas y la valoración en'},
			index: {page_title: 'Caura | Directorio de restaurantes y sus perfiles financieros',
					page_description: 'Encuentre miles de restaurantes, información sobre sus finanzas y la salud de flujo de caja. Explora una estimación de valuación de restaurantes en Texas, Florida y Nuevo México.'},
			search: {page_title: 'Caura | Financial services for independent restaurants',
					three_points: ['Competitive Analytics','Food Costs','Inventory Management']},
			about: {page_title: 'About Us - why focus on small business & lending?'},
			privacy: {page_title: 'Privacy - why make data public?'}
		},
		all_pages: {
			twitter_share_text: encodeURIComponent('#smallbiz #PYMES #insight'),
			encoded_meta_description: encodeURIComponent('Realizamos análisis de valuación de negocios en miles de pequeñas empresas. Aprenda cómo su empresa se valora. Aprender sobre valoración de empresas de restaurante.'),
			meta_description: 'Realizamos análisis de valuación de negocios en miles de pequeñas empresas. Aprenda cómo su empresa se valora. Aprender sobre la valoración de empresas en la restauración.'
		},
	}
};

module.exports = config;
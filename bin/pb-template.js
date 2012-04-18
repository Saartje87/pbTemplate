/**
 * Templating
 */
/**
PB.Template
-----------
+ constructor ( html-chunk )
+ compile						Parse html to function?
+ parse							Should return childs
+ toString

Templating language
-----------
{name}

{item.name}

{for item in items}
	{item.name}
{endfor}

{for item in items.0.subitems}			??
	{item.name}
{endfor}

{if item.name}
	{item.name}
{else}
	No name
{endif}
*/
(function ( PB ){
	
	var doc = document;

	PB.Template = PB.Class({

		/**
		 * Cached for loop regexp
		 * Matches {for:1 var in set}{var}{endfor:1} {for var in set}{var.name}{endfor}
		 */
		cachedFor: /\{for:?(\d+)? (\w+) in ([\w\.]+)\}(.*?)\{endfor:?\1+?\}/g,

		/**
		 * Cached var regexp
		 * {name} get value form key or the var from context
		 * {object.name} get value from key
		 * {array.0} first in array
		 */
		cachedVar: /\{([\w\.]+)\|?([\w_-]+)?:?(.*?)\}/g,

		/**
		 * Helds parse output when render method is used
		 */
		rendered: null,

		/**
		 * Populate class with template string
		 *
		 * @param string template
		 * @param boolean do not remove line endings, tabs, extra spaces(2+), html comment
		 */
		construct: function ( template, plainText ) {

			this.template = plainText
				? template
				: this.clean( template );
		},

		/**
		 * Strip template
		 *
		 * @param string template
		 */
		clean: function ( template ) {
			
			template = template.replace(/\n+/g, '')
				.replace(/\t+/g, '')
				.replace(/<!--.*?-->/g, '')
				.replace(/[\s]{2,}/g, ' ');

			return template;
		},

		/**
		 * Parse data in template
		 */
		parse: function ( context, template ) {

			var ouput;

			template = template || this.template;

			// Parse loops
			ouput = template.replace( this.cachedFor, this.parseLoops.bind(this, context) );
			
			// Parse vars
			ouput = ouput.replace( this.cachedVar, this.parseVars.bind(this, context) );

			return ouput;
		},

		/**
		 * Parse loops
		 */
		parseLoops: function ( context ) {
			
			var ouput = '',
				key = arguments[3],
				ns = this._getByNameSpace( context, arguments[4] );
				
			for( var i in ns ) {

				if( ns.hasOwnProperty(i) === true && ns[i] !== null ) {

					ouput += this.parse( ns[i], arguments[5] );
				}
			}

			return ouput;
		},

		/**
		 * Parse statement
		 *
		 * todo: Add statements
		 *	- if else endif
		 */
		parseStatements: function () {


		},

		/**
		 * Replace var match with value
		 */
		parseVars: function ( context ) {
			
			var value = this._getByNameSpace( context, arguments[2] ),
				method = arguments[3],
				args = arguments[4];

			if( method && Template.Methods[method] ) {

				if( args ) {

					args = args.split(',');
					args.unshift(value);
				} else {

					args = [value];
				}

				value = Template.Methods[method].apply(null, args);
			}

			return value;
		},

		/**
		 * Returns new context a.k. namespace :)
		 */
		_getByNameSpace: function ( context, ns ) {

			ns = ns.split('.');

			ns.forEach(function ( ns ){
				
				context = typeof context[ns] !== 'undefined' ? context[ns] : context;
			});

			return context;
		},

		appendTo: function ( element, data ) {
			
			var fragment = doc.createDocumentFragment(),
				// parentNodeType should be in own method, td shold have parent of tr etc..
				// should better be in pbjs as do builder/helper
				nodeName = element.nodeName,
				parentNodeType = ['TBODY', 'TR'].indexOf(nodeName) > -1 ? 'table' : 'div',
				div = doc.createElement(parentNodeType),
				child,
				childs;
				
			element = PB(element).node;

			div.innerHTML = this.parse( data );
			
			// Tmp hack, would otherwise return tbody instead of tr..
			if( parentNodeType === 'table' ) {
				
				div = div.firstChild
			}

			while( child = div.firstChild ) {

				fragment.appendChild( child );
			}

			// Map to PB
			childs = PB.toArray( fragment.childNodes ).map(PB);

			element.appendChild( fragment );

			fragment = div = element = null;

			return childs;
		},

		replace: function ( element, data ) {

			var fragment = doc.createDocumentFragment(),
				div = doc.createElement('div'),
				child,
				childs;

			element = PB(element).node;

			div.innerHTML = this.parse( data );

			while( child = div.firstChild ) {

				fragment.appendChild( child );
			}

			childs = PB.toArray( fragment.childNodes ).map(PB);

			element.parentNode.insertBefore( fragment, element );

			PB(element).remove();

			fragment = div = element = null;

			return childs;
		}
	});

	PB.Template.Methods = {};

	PB.Template.register = function ( name, method ){

		PB.Template.Methods[name] = method;
	};

	return PB.Template;
})( PB );

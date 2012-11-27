var views = {
	App : Backbone.View.extend({
		events : {
			'click #reset' : 'reset'
		},
		
		yourCarryContainer : null,
		
		enemyCarryContainer : null,
		
		enemySupportContainer : null,
		
		yourSupportContainer : null,
		
		weightingForm : null,
		
		initialize : function() {
			var initContainer = function(rowType, collection) {
				var row = new views.Row({rowType : rowType});
	
				for(var key in collection) {
					var sprite = new views.Sprite({indexNumber : key});
			
					row.addSprite(sprite);
				}
		
				var container = new views.Container({titleTag : rowType});
		
				container.addRow(row);
		
				return container;
			};
			
			document.createElement('IMG').src = 'images/icons-gray.gif';
		
			this.yourCarryContainer = initContainer('Your Carry', carries);
			this.enemyCarryContainer = initContainer('Enemy Carry', carries);
			this.enemySupportContainer = initContainer('Enemy Support', supports);
			this.yourSupportContainer = initContainer('Your Support', supports);
			
			this.yourCarryContainer.row.on('spriteSelectionChange', this.onSelectionChange, this);
			this.enemyCarryContainer.row.on('spriteSelectionChange', this.onSelectionChange, this);
			this.enemySupportContainer.row.on('spriteSelectionChange', this.onSelectionChange, this);
			
			this.weightingForm = new views.WeightForm({el: $('#weightingForm').get(0)});
			this.weightingForm.on('weightingChange', this.onSelectionChange, this);
		},
		
		reset : function() {
			this.yourCarryContainer.row.clearHighlight().deselectAll();
			this.enemyCarryContainer.row.clearHighlight().deselectAll();
			this.enemySupportContainer.row.clearHighlight().deselectAll();
			this.yourSupportContainer.row.clearHighlight().deselectAll();
		},
		
		render : function() {
			var div = $('<div>')
				.append(this.yourCarryContainer.el)
				.append(this.enemyCarryContainer.el)
				.append(this.enemySupportContainer.el)
				.append(this.yourSupportContainer.el);
				
			this.$el.append(div);
		},
		
		onYourCarrySelectionChange : function() {
			this.onSelectionChange();
		},
		
		onSelectionChange : function() {
			var yourCarry = this.yourCarryContainer.row.selectedIndexNumber;
			var enemyCarry = this.enemyCarryContainer.row.selectedIndexNumber;
			var enemySupport = this.enemySupportContainer.row.selectedIndexNumber;
			
			var yourSupport = this.calculateYourSupport(yourCarry, enemyCarry, enemySupport);
			
			yourSupport = _.first(yourSupport, 3);
			
			console.info('--');
			
			this.yourSupportContainer.row.highlight(yourSupport);
		},
		
		calculateYourSupport : function(yourCarry, enemyCarry, enemySupport) {
			var weighting = this.weightingForm.weighting;
			
			if(!yourCarry && !enemyCarry && !enemySupport) {
				return;
			}
			// Your carry
			else if(!enemyCarry && !enemySupport) {
				return this.basedOnYourCarry(weighting, yourCarry);
			}
			// Enemy carry
			else if(!yourCarry && !enemySupport) {
				return this.basedOnEnemyCarry(weighting, enemyCarry);
			}
			// Enemy support
			else if(!yourCarry && !enemyCarry) {
				return this.basedOnEnemySupport(weighting, enemySupport);
			}
			// Your Carry & Enemy Carry
			else if(!enemySupport) {
				return this.basedOnYourCarryAndEnemyCarry(weighting, yourCarry, enemyCarry);
			}
			// Your Carry & Enemy Support
			else if(!enemyCarry) {
				return this.basedOnYourCarryAndEnemySupport(weighting, yourCarry, enemySupport);
			}
			// Enemy Carry & Enemy Support
			else if(!yourCarry) {
				return this.basedOnEnemyCarryAndEnemySupport(weighting, enemyCarry, enemySupport);
			}
			else {
				return this.cys3(weighting, yourCarry, enemyCarry, enemySupport);
			}
		},
		
		/**
		 * Returns intersection(first, second) + (union(first, second) - intersection(first, second))
		 *
		 * This means all items in both will be up front, ordered by their appearance in first.
		 * The remaining items will be appended by the order in first then second.
		 */
		weight : function(first, second) {
			var all = _.union(first, second);
			
			console.log('ONE: ' + this.log(first));
			console.log('TWO: ' + this.log(second));
			
			var intersect = _.intersection(first, second);
			
			var remainder = _.difference(all, intersect);
			
			var concat = intersect.concat(remainder);
			
			return concat;
		},
		
		basedOnYourCarry : function(weighting, yourCarry) {
			return carries[yourCarry].pro;
		},
		
		basedOnEnemyCarry : function(weighting, enemyCarry) {
			return carries[enemyCarry].con;
		},
		
		basedOnEnemySupport : function(weighting, enemySupport) {
			return supports[enemySupport].counters;
		},
		
		basedOnYourCarryAndEnemyCarry : function(weighting, yourCarry, enemyCarry) {			
			var pro = this.basedOnYourCarry(weighting, yourCarry);
			var con = this.basedOnEnemyCarry(weighting, enemyCarry);
			
			if(weighting == 'yourCarry') {
				return this.weight(pro, con);
			}
			else if(weighting == 'enemyCarry') {
				return this.weight(con, pro);
			}
			else {
				return [];
			}
		},
		
		basedOnYourCarryAndEnemySupport : function(weighting, yourCarry, enemySupport) {
			var pro = this.basedOnYourCarry(weighting, yourCarry);
			var con = this.basedOnEnemySupport(weighting, enemySupport);
			
			if(weighting == 'yourCarry') {
				return this.weight(pro, con);
			}
			else if(weighting == 'enemySupport') {
				return this.weight(con, pro);
			}
			else {
				return [];
			}
		},
		
		basedOnEnemyCarryAndEnemySupport : function(weighting, enemyCarry, enemySupport) {
			var one = this.basedOnEnemyCarry(weighting, enemyCarry);
			var two = this.basedOnEnemySupport(weighting, enemySupport);
			
			if(weighting == 'enemyCarry') {
				return this.weight(one, two);
			}
			else if(weighting == 'enemySupport') {
				return this.weight(two, one);
			}
			else {
				return [];
			}
		},
		
		cys3 : function(weighting, yourCarry, enemyCarry, enemySupport) {
			if(weighting == 'yourCarry') {
				return weightYourCarry.call(this);
			}
			else if(weighting == 'enemyCarry') {
				return weightEnemyCarry.call(this);
			}
			else {
				return weightEnemySupport.call(this);
			}
			
			function weightYourCarry() {
				var basedOnYourCarryAndEnemyCarry = this.basedOnYourCarryAndEnemyCarry(weighting, yourCarry, enemyCarry);
				
				basedOnYourCarryAndEnemyCarry = _.without(basedOnYourCarryAndEnemyCarry, enemySupport);
			
				return basedOnYourCarryAndEnemyCarry;
			};
			
			function weightEnemyCarry() {
				var basedOnYourCarryAndEnemyCarry = this.basedOnYourCarryAndEnemyCarry(weighting, yourCarry, enemyCarry);
				
				basedOnYourCarryAndEnemyCarry = _.without(basedOnYourCarryAndEnemyCarry, enemySupport);
			
				return basedOnYourCarryAndEnemyCarry;
			};
			
			function weightEnemySupport() {
				var pro = this.basedOnYourCarry(weighting, yourCarry);
				var con = carries[enemyCarry].con;
				var counters = supports[enemySupport].counters;
				var all = _.union(counters, con, pro);
			
				console.log('PRO: ' + this.log(pro));
				console.log('CON: ' + this.log(con));
				console.log('CTR: ' + this.log(counters));
			
				var intersect = _.intersection(counters, pro, con);
			
				var remainder = _.difference(all, intersect);
			
				var concat = intersect.concat(remainder);
			
				return concat;
			};
		},
		
		log : function(arr) {
			var names = [];
			
			for(var i = 0, l = arr.length; i < l; i++) {
				names.push(characters[arr[i]]);
			}
			
			return names.join(', ');
		}
	}),
	
	WeightForm : Backbone.View.extend({
		events : {
			'click input[type="radio"]' : 'onWeightingChange'
		},
		
		weighting : 'yourCarry',
		
		initialize : function() {
			this.weighting = this.$el.find('input[type="radio"]:checked').val();
		},
		
		onWeightingChange : function(e) {
			this.weighting = e.currentTarget.value;
			
			this.trigger('weightingChange');
		}
	}),

	Container : Backbone.View.extend({
		titleTag : null,
	
		tagName : 'div',
		
		attributes : {
			'class' : 'container'
		},
		
		row : null,
		
		initialize : function(options) {
			this.titleTag = options.titleTag || 'Unknown';
			
			var title = this.make('h2', null, this.titleTag);
			this.$el.append(title);
		},
		
		render : function() {
			return this;
		},
		
		addRow : function(row) {
			this.row = row;
			this.$el.append(row.el);
		}
	}),

	Row : Backbone.View.extend({
		tagName : 'div',
		
		attributes : {
			'class' : 'row' 
		},
		
		rowType : null,
		
		sprites : null,
		
		selectedIndexNumber : null,
		
		initialize : function(options) {
			this.sprites = [];
			
			this.rowType = options.rowType;
		},
		
		render : function() {
			return this;
		},
		
		addSprite : function(sprite) {
			this.sprites.push(sprite);
			
			sprite.on('select', this.onSpriteSelectionChange, this);
			
			this.$el.append(sprite.el);
		},
		
		onSpriteSelectionChange : function(spriteView) {
			for(var i = 0, l = this.sprites.length; i < l; i++) {
				if(this.sprites[i].isSelected) {
					this.sprites[i].deselect();
				}
				
				if(this.sprites[i].cid != spriteView.cid) {
					this.sprites[i].grayscale();
				}
			}
			
			spriteView.select().color();
				
			this.selectedIndexNumber = spriteView.indexNumber;
			
			this.trigger('spriteSelectionChange', this);
		},
		
		highlight : function(indexNumbers) {
			this.clearHighlight();
			
			for(var j = 0, k = this.sprites.length; j < k; j++) {
				var index = _.indexOf(indexNumbers, this.sprites[j].indexNumber);
				
				if(index != -1) {
					this.sprites[j].setNumber(index + 1).color();
				}
				else {
					this.sprites[j].grayscale();
				}
			}
			
			return this;
		},
		
		clearHighlight : function() {
			for(var j = 0, k = this.sprites.length; j < k; j++) {
				this.sprites[j].color().setNumber('');
			}
			
			return this;
		},
		
		deselectAll : function() {
			for(var j = 0, k = this.sprites.length; j < k; j++) {
				if(this.sprites[j].isSelected) {
					this.sprites[j].deselect();
				}
			}
			
			return this;
		}
	}),
	
	Sprite : Backbone.View.extend({
		indexNumber : null,
	
		tagName : 'div',
		
		attributes : {
			'class' : 'span1 sprite'
		},
		
		events : {
			'click a.select' : 'onSelect',
			'mouseover a.select' : 'onMouseover',
			'mouseout a.select' : 'onMouseout'
		},
		
		isSelected : false,
		
		initialize : function(options) {
			if(_.isString(options.indexNumber) == false) {
				throw 'need index number';
			}
			
			this.indexNumber = options.indexNumber;
			
			this.$el
				.addClass('sprite-' + this.indexNumber)
				.append(this.make('a', {'class' : 'select', 'href' : '#'}));
		},
		
		render : function() {
			return this;
		},
		
		onSelect : function() {
			this.$el.data('mouseover', false);
			
			this.trigger('select', this);
			
			return false;
		},
		
		onMouseover : function(e) {
			if(this.$el.hasClass('sprite-gray')) {
				this.$el.data('mouseover', true);
				this.color();
			}
		},
		
		onMouseout : function() {
			if(this.$el.data('mouseover') === true) {
				this.$el.data('mouseover', false);
				this.grayscale();
			}
		},
		
		select : function() {
			this.isSelected = true;
			this.$el.children('a.select').addClass('selected');
			
			return this;
		},
		
		deselect : function() {
			this.isSelected = false;
			this.$el.children('a.select').removeClass('selected');
			
			return this;
		},
		
		setNumber : function(number) {
			this.$el.children('a.select').text(number);
			
			return this;
		},
		
		grayscale : function() {
			this.$el.addClass('sprite-gray').removeClass('sprite');
			
			return this;
		},
		
		color : function() {
			this.$el.addClass('sprite').removeClass('sprite-gray');
			
			return this;
		}
	})
};

var init = {
	support : function(rowType) {
		var row = new views.Row({rowType : rowType});
	
		for(var support in supports) {
			var s = supports[support];
			
			var sprite = new views.Sprite({indexNumber : support});
			
			row.addSprite(sprite);
		}
		
		var container = new views.Container({titleTag : rowType});
		
		container.addRow(row);
		
		$('#app').append(container.render().el);
		
		return container;
	},
	
	carries : function(rowType) {
		var row = new views.Row({rowType : rowType});
	
		for(var carry in carries) {
			var c = carries[carry];
			
			var sprite = new views.Sprite({indexNumber : carry});
			
			row.addSprite(sprite);
		}
		
		var container = new views.Container({titleTag : rowType});
		
		container.addRow(row);
		
		$('#app').append(container.render().el);
		
		return container;
	}
};

$(function() {
	app = new views.App({el: $('#app').get(0)});
	
	app.render();
});
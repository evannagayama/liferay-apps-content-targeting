AUI.add(
	'liferay-ct-form-builder',
	function(A) {
		var AVAILABLE_FIELD_LABEL_TPL = '<div class="row"><div class="field-title">{name}</div><div class="field-description">{description}</div></div>',

			FIELD_LABEL_TPL = '{name}',

			ITEM_FIELD_TPL = '<div>' +
				'<div class="field-header">' +
					'<div class="field-icon">' +
						'<i class="{icon}"></i>' +
					'</div>' +
					'<div class="row field-info">' +
						'<div class="field-title">{name}</div>' +
						'<div class="field-description">{description}</div>' +
					'</div>' +
				'</div>' +
				'<div class="field-editor">{editor}</div>' +
			'</div>',

			ITEM_CATEGORY_HEADER_TPL = '<div class="category-header toggler-header toggler-header-expanded">' +
				'<span class="category-icon icon {icon}"></span>' +
				'<div class="category-info"> ' +
					'<div class="category-title">{name}</div>' +
					'<div class="category-description">{description}</div>' +
				'</div>' +
			'</div>',

			ITEM_CATEGORY_CONTENT_TPL = '<div class="category-content toggler-content toggler-content-expanded"></div>',

			LiferayCTFormItemSearch = A.Base.create('Search', A.Base, [A.AutoCompleteBase],
				{
					initializer: function() {
						this._bindUIACBase();
						this._syncUIACBase();
					}
				}
			),

			LiferayCTFormBuilder = A.Component.create(
				{
					EXTENDS: A.FormBuilder,

					NAME: 'liferay-ct-form-builder',

					ATTRS: {
						searchBox: {
							setter: A.one
						}
					},

					prototype: {
						initializer: function() {
							var instance = this,
								eventHandles = [],
								fieldsFilter;

							instance._parseFields();

							if (instance.get('searchBox')) {
								fieldsFilter = instance._createItemFilter();

								eventHandles.push(
									fieldsFilter.on('results', instance._onItemFilterResults, instance)
								);
							}

							instance.after(instance._afterUiSetAvailableFields, instance, '_uiSetAvailableFields');

							instance._eventHandles = eventHandles;
						},

						destructor: function() {
							var instance = this;

							(new A.EventHandle(instance._eventHandles)).detach();
						},

						_afterUiSetAvailableFields: function(event) {
							var instance = this,
								fieldsContainer = A.one('.diagram-builder-fields-container'),
								searchBox = instance.get('searchBox');

							if (searchBox) {
								A.one('.tab-pane.active').insertBefore(
									searchBox,
									fieldsContainer
								).removeClass('hide');
							}

							var categories = {};

							A.Array.each(
								instance.get('availableFields'),
								function(item) {
									var title = item.labelNode.one('.field-title').text();

									var itemNode = item.get('node');

									itemNode.attr('title', title);

									var category = item.get('options').category;

									var categoryKey = category.key;

									if (category && categoryKey) {
										if (!categories[categoryKey]) {
											categories[categoryKey] = {
												category: category,
												fields: []
											};
										}

										categories[categoryKey].fields.push(itemNode);
									}
								}
							);

							instance._groupFields(categories, fieldsContainer);
						},

						_createItemFilter: function() {
							var instance = this,
								fieldSearch = new LiferayCTFormItemSearch
								(
									{
										inputNode: instance.get('searchBox').one('input'),
										minQueryLength: 0,
										queryDelay: 0,

										source: (function() {
											return A.Array.map(
												instance.get('availableFields'),
												function(field) {
													return {
														node: field.labelNode,
														searchData: field.labelNode.one('.field-title').text()
													}
												}
											);
										}()),

										resultTextLocator: 'searchData',

										resultFilters: 'phraseMatch'
									}
								);

							return fieldSearch;
						},

						_groupFields: function(categories, fieldsContainer) {
							var instance = this,
								categoryContent,
								categoryHeader,
								categoryWrapper;

							A.Object.each(
								categories,
								function(item) {
									categoryHeader = A.Node.create(
										A.Lang.sub(
											ITEM_CATEGORY_HEADER_TPL,
											{
												description: item.category.description,
												icon: item.category.icon,
												name: item.category.name
											}
										)
									);

									categoryContent = A.Node.create(
										A.Lang.sub(
											ITEM_CATEGORY_CONTENT_TPL
										)
									);

									A.Array.each(
										item.fields,
										function(field) {
											categoryContent.append(field);
										}
									);

									categoryWrapper = A.Node.create('<div class="category-wrapper"></div>');
									categoryWrapper.append(categoryHeader);
									categoryWrapper.append(categoryContent);

									fieldsContainer.append(categoryWrapper);
								}
							);

							if (!instance._togglerDelegate) {
								instance._togglerDelegate = new A.TogglerDelegate(
									{
										animated: true,
										container: fieldsContainer,
										content: '.category-content',
										expanded: true,
										header: '.category-header'
									}
								);
							}
						},

						_onClickField: function(event) {
							var instance = this,
								field = A.Widget.getByNode(event.target);

							instance.simulateFocusField(field, event.target);

							event.stopPropagation();
						},

						_onItemFilterResults: function(event) {
							var instance = this;

							A.all('.diagram-builder-field').addClass('hide');

							A.Array.each(
								event.results,
								function(result) {
									result.raw.node.ancestor('.diagram-builder-field').removeClass('hide');
								}
							);
						},

						_parseFields: function() {
							var instance = this,
								contentBox = instance.get('contentBox'),
								availableFieldsContainer = contentBox.one('.diagram-builder-fields-container'),
								availableFields = [],
								fieldsContainer = contentBox.one('.form-builder-drop-container'),
								fields = [];

							if (availableFieldsContainer) {
								availableFields = instance._parseFieldContainer(availableFieldsContainer, AVAILABLE_FIELD_LABEL_TPL);
							}

							if (fieldsContainer) {
								fields = instance._parseFieldContainer(fieldsContainer, FIELD_LABEL_TPL);
							}

							instance.set('availableFields', availableFields);
							instance.set('fields', fields);
						},

						_parseFieldContainer: function(fieldsContainer, labelTpl) {
							var instance = this,
								fields = [];

							fieldsContainer.all('.form-builder-field').each(
								function(field) {
									var categoryDescription = field.attr('data-categorydescription'),
										categoryIcon = field.attr('data-categoryicon'),
										categoryKey = field.attr('data-categorykey'),
										categoryName = field.attr('data-categoryname'),
										description = field.one('.field-description').text(),
										editor = field.attr('data-template'),
										icon = field.attr('data-icon'),
										key = field.attr('data-key'),
										name = field.one('.field-title').text(),
										unique = field.attr('data-unique') === 'true';

									A.LiferayCTFormBuilder.registerField(
										{
											description: description,
											editor: editor,
											icon: icon,
											key: key,
											name: name
										}
									);

									fields.push(
										{
											iconClass: icon,
											id: /^([^_]*)(_.*)?$/.exec(key)[1],
											label: A.Lang.sub(
												labelTpl,
												{
													name: name,
													description: description
												}
											),
											options: {
												category: {
													description: categoryDescription,
													icon: categoryIcon,
													key: categoryKey,
													name: categoryName
												}
											},
											type: key,
											unique: unique
										}
									);
								}
							);

							return fields;
						},

						exportAsJSON: function() {
							var instance = this,
								fields = {
									fields: []
								};

							instance.get('fields').each(
								function(item) {
									var field = {
										id: item.get('id'),
										data: [],
										type: item.get('type')
									};

									var contentBox = item.get('contentBox');

									contentBox.all('input, select, textarea').each(
										function(input) {
											field.data.push(
												{
													name: input.attr('name'),
													value: input.val()
												}
											);
										}
									);

									fields.fields.push(field);
								}
							);

							return JSON.stringify(fields);
						},

						simulateFocusField: function(field, target) {
							var instance = this,
								lastFocusedField = instance.lastFocusedField;

							if (lastFocusedField) {
								lastFocusedField.blur();
							}

							instance.lastFocusedField = field.focus();

							if (target) {
								target.focus();
							}
						}
					}
				}
			);

		LiferayCTFormBuilder.registerField = function(field) {
			var fieldName = 'ct-' + field.key + '-field-field';

			var ctFormField = A.Component.create(
				{
					NAME: fieldName,

					EXTENDS: A.FormBuilderField,

					ATTRS: {
						acceptChildren: {
							readOnly: true,
							value: false
						}
					},

					prototype: {
						getHTML: function() {
							var instance = this;

							return A.Lang.sub(
								ITEM_FIELD_TPL,
								{
									description: field.description,
									editor: field.editor,
									icon: field.icon,
									name: field.name
								}
							);
						},

						getNode: function() {
							var instance = this,
								templateContainer = A.Node.create('<div></div>');

							templateContainer.plug(A.Plugin.ParseContent);
							templateContainer.setContent(instance.getHTML());

							return templateContainer;
						}
					}
				}
			);

			A['CT'+ field.key + 'ItemField'] = ctFormField;

			if (!A.FormBuilder.types[field.key]) {
				A.FormBuilder.types[field.key] = ctFormField;
			}
		};

		A.LiferayCTFormBuilder = LiferayCTFormBuilder;
	},
	'',
	{
		requires: ['aui-form-builder', 'aui-parse-content', 'aui-toggler', 'autocomplete-base', 'autocomplete-filters']
	}
);
import * as _ from 'lodash';
import {BlocksModel} from "./BlocksModel";

interface Data {
	properties
	classes
	drops
}

export class BlockModel {
	private doc: Document;
	private element: Element;

	private blocksModel: BlocksModel;

	private propertyRequiredFields = ['name', 'value'];

	public id: number;
	public name: string;
	public data: Data = {
		properties: [],
		classes: [],
		drops: []
	};
	public showContent: boolean = false;
	public addingProperty: boolean = false;
	public addingDrop: boolean = false;
	public addingClass: boolean = false;
	public dropAdding = [];
	public classAdding = [];
	public propertyAdding = [];

	constructor(doc: Document, element: Element, blocksModel: BlocksModel) {
		this.doc = doc;
		this.element = element;
		this.blocksModel = blocksModel;
		this.reset();
	}

	public reset() {
		this.data.properties.splice(0);
		this.data.classes.splice(0);
		this.data.drops.splice(0);
		this.loadDataFromElement(this.element);
	}

	getBlockImageURL() {
		return `images/itemicons/${this.getBlockImageName()}`;
	}

	getBlockImageName() {
		let imgName = this.name;
		if (this.hasPropertyByName('CustomIcon')) {
			imgName = this.getPropertyAttribute(this.getPropertyByName('CustomIcon'), 'value');
		}
		return `${imgName}.png`;
	}

	public initiateNewDrop() {
		this.dropAdding = [];
		_.each(this.blocksModel.dropSchema, (item) => {
			this.dropAdding.push(JSON.parse(JSON.stringify(item)));
		});
	}

	public initiateNewClass() {
		this.classAdding = [];
		_.each(this.blocksModel.classSchema, (item) => {
			this.classAdding.push(JSON.parse(JSON.stringify(item)));
		});
	}

	public initiateNewProperty() {
		this.propertyAdding = [];
		_.each(this.blocksModel.propertySchema, (item) => {
			this.propertyAdding.push(JSON.parse(JSON.stringify(item)));
		});
	}

	public addDrop() {
		// prepare data
		let event = this.dropAdding[0].value;
		let element = this.doc.createElement('drop');
		element.setAttribute('event', event);

		// create
		this.element.appendChild(element);
		this.data.drops.push(this.parseDrop(element));

		// confirm success
		return true;
	}

	public addClass() {
		// prepare data
		let name = this.classAdding[0].value;
		let element = this.doc.createElement('property');
		element.setAttribute('class', name);

		// validations
		if (this.hasClassByName(name)) {
			this.classAdding[0].error = `${name} is already set!`;
			return false;
		}

		// create
		this.element.appendChild(element);
		this.data.classes.push({
			properties: [],
			propertiesEdit: [],
			name: name,
			element: element
		});

		// confirm success
		return true;
	}

	public addProperty() {
		// prepare data
		let propertyElement = this.doc.createElement('property');
		let keys = {};
		for (let i in this.propertyAdding) {
			let attribute = this.propertyAdding[i];
			keys[attribute.name] = i;
			if (attribute.value.length > 0) {
				propertyElement.setAttribute(attribute.name, attribute.value);
			}
		}
		// validations
		let name = propertyElement.getAttribute('name');
		if (this.hasPropertyByName(name)) {
			this.propertyAdding[keys['name']].error = `${name} is already set!`;
			return false;
		}

		// create
		this.element.appendChild(propertyElement);
		this.data.properties.push({
			data: this.parseProperty(propertyElement),
			element: propertyElement
		});

		// confirm success
		return true;
	}

	public updateProperty(property) {
		// find differences
		let original = this.parseProperty(property.element);
		let actual = this.getPropertyByName(this.getPropertyAttribute(property, 'name')).data;
		let originalToEdit = this.filterPropertyInputData(original);
		let actualToEdit = this.filterPropertyInputData(actual);
		for (let name in actualToEdit) {
			if (actualToEdit[name].length < 1) {
				delete actualToEdit[name];
			}
		}
		let differences = this.findDiferences(originalToEdit, actualToEdit);

		// update rendered data and DOM element
		_.each(differences.changed, (name) => {
			this.updatePropertyAttributeValue(property, name, actualToEdit[name]);
			property.element.setAttribute(name, actualToEdit[name]);
		});
		_.each(differences.deleted, (name) => {
			this.deletePropertyAttribute(property, name);
		});
		// confirm success
		return true;
	}

	public updateClass(cs) {
		// find differences
		let original = cs.properties;
		let actual = cs.propertiesEdit;
		let originalData = {};
		let actualData = {};
		_.each(original, (property) => {
			originalData[property.data.name] = property.data.value;
		});
		let names = [];
		let foundDuplicitName = false;
		_.each(actual, (property) => {
			// validate properties duplicity
			if (_.includes(names, property.data.name)) {
				foundDuplicitName = true;
				property.error = `Duplicit property name!`;
			}
			actualData[property.data.name] = property.data.value;
			names.push(property.data.name);
		});
		if (foundDuplicitName) {
			return false;
		}
		let differences = this.findDiferences(originalData, actualData);

		// update rendered data and DOM element
		_.each(differences.changed, (name) => {
			cs.properties[this.getClasPropertyIndex(cs, name)].data.value = actualData[name];
			cs.properties[this.getClasPropertyIndex(cs, name)].element.setAttribute('value', actualData[name]);
		});
		_.each(differences.deleted, (name) => {
			this.deleteClassProperty(cs, name);
		});
		_.each(differences.added, (name) => {
			let prop = actual[this.getClassPropertyEditIndex(cs, name)];
			prop.element.setAttribute('name', name);
			prop.element.setAttribute('value', actualData[name]);
			cs.element.appendChild(prop.element);
			cs.properties.push(prop);
		});
		// confirm success
		return true;
	}

	public updateDrop(drop) {
		// find differences
		let original = drop.attributes;
		let actual = drop.attributesEdit;
		let originalData = {};
		let actualData = {};
		_.each(original, (attribute) => {
			originalData[attribute.data.name] = attribute.data.value;
		});
		let names = [];
		let foundDuplicitName = false;
		_.each(actual, (attribute) => {
			// validate properties duplicity
			if (_.includes(names, attribute.data.name)) {
				foundDuplicitName = true;
				attribute.error = `Duplicit attribute name!`;
			}
			actualData[attribute.data.name] = attribute.data.value;
			names.push(attribute.data.name);
		});
		if (foundDuplicitName) {
			return false;
		}
		let differences = this.findDiferences(originalData, actualData);

		// update rendered data and DOM element
		_.each(differences.changed, (name) => {
			drop.attributes[this.getDropAttributeIndex(drop, name)].data.value = actualData[name];
			drop.element.setAttribute(name, actualData[name]);
		});
		_.each(differences.deleted, (name) => {
			drop.element.removeAttribute(name);
			drop.attributes.splice(this.getDropAttributeIndex(drop, name), 1);
		});
		_.each(differences.added, (name) => {
			let attribute = actual[this.getDropAttributeEditIndex(drop, name)];
			drop.element.setAttribute(name, actualData[name]);
			drop.attributes.push(attribute);
		});
		// confirm success
		return true;
	}

	public addDropAttributeEdit(drop) {
		drop.attributesEdit.push({
			data: {
				name: '',
				value: '',
			},
			error: ''
		});
	}

	public deleteDrop(drop) {
		let index = this.data.drops.indexOf(drop);
		drop.element.parentNode.removeChild(drop.element);
		this.data.drops.splice(index, 1);
	}

	public deleteDropAttributeEdit(drop, attribute) {
		let index = this.getDropAttributeEditIndex(drop, attribute.data.name);
		drop.attributesEdit.splice(index, 1);
	}

	public deleteClass(cs) {
		let index = this.getClassIndexByName(cs.name);
		cs.element.parentNode.removeChild(cs.element);
		this.data.classes.splice(index, 1);
	}

	public addClassPropertyEdit(cs) {
		let propElement = this.doc.createElement('property');
		cs.propertiesEdit.push({
			data: {
				name: '',
				value: '',
			},
			element: propElement,
			error: ''
		});
	}

	public deleteClassPropertyEdit(cs, property) {
		let index = this.getClassPropertyEditIndex(cs, property.data.name);
		cs.propertiesEdit.splice(index, 1);
	}

	public deleteProperty(property) {
		let index = this.getPropertyIndexByName(this.getPropertyAttribute(property, 'name'));
		property.element.parentNode.removeChild(property.element);
		this.data.properties.splice(index, 1);
	}

	public getPropertyAttribute(property, name: string) {
		return property.data[this.getPropertyAttributeIndex(property, name)].value;
	}

	public updatePropertyAttributeValue(property, name: string, value) {
		property.data[this.getPropertyAttributeIndex(property, name)].value = value;
	}

	private getPropertyAttributeIndex(property, name: string) {
		for (let i in property.data) {
			if (property.data[i].name == name) {
				return i;
			}
		}
		alert(`Property ${name} was not found in ${this.name} data!`);
	}

	private deletePropertyAttribute(property, name: string) {
		property.element.removeAttribute(name);
		property.data.splice(this.getPropertyAttributeIndex(property, name), 1);
	}

	private deleteClassProperty(cs, name) {
		_.each(cs.element.childNodes, (propElement: Element) => {
			if (propElement.tagName == 'property') {
				if (propElement.getAttribute('name') == name) {
					cs.element.removeChild(propElement);
				}
			}
		});
		cs.properties.splice(this.getClasPropertyIndex(cs, name), 1);
	}

	private getClasPropertyIndex(cs, name): any {
		for (let i in cs.properties) {
			if (cs.properties[i].data.name == name) {
				return i;
			}
		}
		alert(`Property ${name} was not found in ${cs.name} class and ${this.name} data!`);
	}

	private getClassPropertyEditIndex(cs, name): any {
		for (let i in cs.propertiesEdit) {
			if (cs.propertiesEdit[i].data.name == name) {
				return i;
			}
		}
		alert(`Property edit ${name} was not found in ${cs.name} class and ${this.name} data!`);
	}

	private getDropAttributeIndex(drop, name): any {
		for (let i in drop.attributes) {
			if (drop.attributes[i].data.name == name) {
				return i;
			}
		}
		alert(`Attribute edit ${name} was not found in ${drop.name} drop and ${this.name} data!`);
	}

	private getDropAttributeEditIndex(drop, name): any {
		for (let i in drop.attributesEdit) {
			if (drop.attributesEdit[i].data.name == name) {
				return i;
			}
		}
		alert(`Attribute edit ${name} was not found in ${drop.name} drop and ${this.name} data!`);
	}

	private findDiferences(o, n) {
		let added = [];
		let changed = [];
		let deleted = [];
		for (let name in o) {
			if (!_.has(n, name)) {
				deleted.push(name);
			} else {
				if (o[name] != n[name]) {
					changed.push(name);
				}
			}
		}
		for (let name in n) {
			if (!_.has(o, name)) {
				added.push(name);
			}
		}
		return {
			added: added,
			changed: changed,
			deleted: deleted
		};
	}

	private filterPropertyInputData(property) {
		let data = [];
		for (let i in property) {
			let item = property[i];
			if (this.blocksModel.view.isPropertyAttributeNameToEdit(item.name)) {
				data[item.name] = item.valueEdit;
			}
		}
		return data;
	}

	private loadDataFromElement(element: Element) {
		this.id = Number(element.getAttribute('id'));
		this.name = element.getAttribute('name');
		_.each(element.childNodes, (element: Element) => {
			if (element.tagName == 'property') {
				if (element.hasAttribute('class')) {
					if (element.attributes.length > 1) {
						this.blocksModel.addError(
							`${element.tagName} in block ${this.name} has class ${element.getAttribute('class')}, but even more attributes which is unexpected. It will not be saved after edit!`
						);
					}
					this.loadClass(element, this.data.classes);
				} else {
					this.loadProperty(element, this.data.properties);
				}
			} else if (element.tagName == 'drop') {
				this.loadDrop(element, this.data.drops);
			} else {
				if (element.tagName) {
					this.blocksModel.addError(`There is unknown element ${element.tagName} in block ${this.name}, it will be lost by edit!`);
				}
			}
		});
	}

	private loadClass(element: Element, data) {
		data.push({
			properties: this.parseClassProperties(element),
			propertiesEdit: this.parseClassProperties(element),
			name: element.getAttribute('class'),
			element: element
		});
	}

	private loadProperty(element: Element, data) {
		let property = this.parseProperty(element);
		data.push({
			data: property,
			element: element
		});
	}

	private loadDrop(element: Element, data) {
		data.push(this.parseDrop(element));
	}

	private parseProperty(element: Element) {
		let attributes = this.parseAttributes(element);
		_.each(attributes, (attr) => {
			if (attr.name == 'name' && attr.value.toLowerCase() == 'extends') {
				attr.link = attr.value;
			}
			attr.required = _.includes(this.propertyRequiredFields, attr.name);

			// dynamic composing of propertySchema creates all addition-form fields collection
			this.blocksModel.propertySchema[attr.name] = {
				name: attr.name,
				required: attr.required,
				value: '',
				error: '',
			};
			attr.valueEdit = attr.value;
		});
		return attributes;
	}

	private parseClassProperties(element: Element): any {
		let classProperties = [];
		_.each(element.childNodes, (propElement: Element) => {
			if (propElement.tagName == 'property') {
				classProperties.push({
					data: {
						name: propElement.getAttribute('name'),
						value: propElement.getAttribute('value'),
					},
					element: propElement,
					error: '',
				});
			}
		});
		return classProperties;
	}

	private parseDropsAttributes(element: Element): any {
		let attributes = this.parseAttributes(element);
		let dropAttributes = [];
		_.each(attributes, (attribute) => {
			dropAttributes.push({
				data: attribute,
				error: '',
			});
		});
		return dropAttributes;
	}

	private parseDrop(element: Element) {
		return {
			element: element,
			attributes: this.parseDropsAttributes(element),
			attributesEdit: this.parseDropsAttributes(element)
		};
	}

	private parseAttributes(element: Element) {
		let item = [];
		_.each(element.attributes, (attr: Attr) => {
			item.push({name: attr.name, value: attr.value});
		});
		return item;
	}

	private hasClassByName(name: string): boolean {
		return Boolean(this.getClassIndexByName(name));
	}

	private hasPropertyByName(name: string): boolean {
		return Boolean(this.getPropertyIndexByName(name));
	}

	private hasClassPropertyByName(cs, name: string): boolean {
		return Boolean(this.getClassPropertyIndexByName(cs, name));
	}

	private getPropertyByName(name: string): any {
		let i = this.getPropertyIndexByName(name);
		if (i) {
			return this.data.properties[i];
		}
	}

	private getClassIndexByName(name: string) {
		for (let i in this.data.classes) {
			if (this.data.classes[i].name == name) {
				return i;
			}
		}
	}

	private getPropertyIndexByName(name: string) {
		for (let i in this.data.properties) {
			if (this.getPropertyAttribute(this.data.properties[i], 'name') == name) {
				return i;
			}
		}
	}

	private getClassPropertyIndexByName(cs, name: string) {
		for (let i in cs.propertiesEdit) {
			if (this.getPropertyAttribute(cs.propertiesEdit[i], 'name') == name) {
				return i;
			}
		}
	}

}

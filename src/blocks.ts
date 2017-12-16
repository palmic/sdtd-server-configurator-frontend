import {BlocksModel} from './model/BlocksModel';
import {App} from './app';
import {autoinject} from 'aurelia-framework';
import * as _ from 'lodash';
import {BlockModel} from './model/BlockModel';
import * as saveAs from 'file-saver';
import {XMLSerializer} from 'xmldom';

@autoinject
export class Blocks {

	public doc: Document;

	public blocksModel: BlocksModel;

	public rendering: boolean = true;
	public formSubmitting: boolean = false;
	public exporting: boolean = false;
	public isFileSaverSupported: boolean;

	private fileName: string = 'blocks.xml';

	constructor(app: App) {
		this.doc = app.doc;
		if (!app.doc) {
			app.router.navigate('');
		} else {
			this.blocksModel = new BlocksModel(app.doc, this);
		}
		try {
			this.isFileSaverSupported = !!new Blob;
		} catch (e) {}

		app.view = this;
	}

	attached() {
		this.rendering = false;
	}

	exportFile() {
		this.exporting = true;
		let xmlSerializer = new XMLSerializer();
		let blob = new Blob([xmlSerializer.serializeToString(this.doc)], {type: 'text/plain;charset=utf-8'});
		saveAs(blob, this.fileName);
		setTimeout(() => {
			this.exporting = false;
		}, 50);
	}

	resetBlock(block: BlockModel) {
		if (confirm(`Do you really want to reset ${block.name}?`)) {
			this.formSubmitting = true;
			block.reset();
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
		}
	}

	addDrop(block: BlockModel) {
		this.formSubmitting = true;
		if (block.addDrop()) {
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
			this.toggleAddingBlockDrop(block, false);
		} else {
			this.formSubmitting = false;
		}
	}

	deleteDrop(drop, block: BlockModel) {
		if (confirm(`Do you really want to delete this drop?`)) {
			this.formSubmitting = true;
			block.deleteDrop(drop);
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
		}
	}

	addClass(block: BlockModel) {
		this.formSubmitting = true;
		if (block.addClass()) {
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
			this.toggleAddingBlockClass(block, false);
		} else {
			this.formSubmitting = false;
		}
	}

	addProperty(block: BlockModel) {
		this.formSubmitting = true;
		if (block.addProperty()) {
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
			this.toggleAddingBlockProperty(block, false);
		} else {
			this.formSubmitting = false;
		}
	}

	updateProperty(property, block: BlockModel) {
		this.formSubmitting = true;
		if (block.updateProperty(property)) {
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
			this.toggleEdit(property, false);
		} else {
			this.formSubmitting = false;
		}
	}

	updateDrop(drop, block: BlockModel) {
		this.formSubmitting = true;
		if (block.updateDrop(drop)) {
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
			this.toggleEdit(drop, false);
		} else {
			this.formSubmitting = false;
		}
	}

	updateClass(cs, block: BlockModel) {
		this.formSubmitting = true;
		if (block.updateClass(cs)) {
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
			this.toggleEdit(cs, false);
		} else {
			this.formSubmitting = false;
		}
	}

	deleteClass(cs, block) {
		if (confirm(`Do you really want to delete ${cs.name}?`)) {
			this.formSubmitting = true;
			block.deleteClass(cs);
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
		}
	}

	addDropAttributeEdit(drop, block) {
		block.addDropAttributeEdit(drop);
	}

	deleteDropAttributeEdit(drop, property, block) {
		block.deleteDropAttributeEdit(drop, property);
	}

	addClassPropertyEdit(cs, block) {
		block.addClassPropertyEdit(cs);
	}

	deleteClassPropertyEdit(cs, property, block) {
		block.deleteClassPropertyEdit(cs, property);
	}

	deleteProperty(property, block) {
		if (confirm(`Do you really want to delete ${block.getPropertyAttribute(property, 'name')}?`)) {
			this.formSubmitting = true;
			block.deleteProperty(property);
			setTimeout(() => {
				this.formSubmitting = false;
			}, 50);
		}
	}

	toggleAddingBlockProperty(block: BlockModel, value?) {
		if (this.toggleAddingProperty(block, value)) {
			block.initiateNewProperty();
		}
	}

	toggleAddingBlockClass(block: BlockModel, value?) {
		if (this.toggleAddingClass(block, value)) {
			block.initiateNewClass();
		}
	}

	toggleAddingBlockDrop(block: BlockModel, value?) {
		if (this.toggleAddingDrop(block, value)) {
			block.initiateNewDrop();
		}
	}

	toggleShowContent(item, value?) {
		return item.showContent = this.toggleValue(item.showContent, value);
	}

	toggleAddingDrop(item, value?) {
		return item.addingDrop = this.toggleValue(item.addingDrop, value);
	}

	toggleAddingClass(item, value?) {
		return item.addingClass = this.toggleValue(item.addingClass, value);
	}

	toggleAddingProperty(item, value?) {
		return item.addingProperty = this.toggleValue(item.addingProperty, value);
	}

	toggleEdit(item, value) {
		return item.edit = this.toggleValue(item.edit, value);
	}

	toggleValue(item, value?) {
		if (value) {
			item = value;
		} else {
			if (item) {
				item = false;
			} else {
				item = true;
			}
		}
		return item;
	}

	isPropertyAttributeNameToShow(name) {
		let invalid = ['__observers__', 'edit'];
		return !_.includes(invalid, name);
	}

	isPropertyAttributeNameToEdit(name) {
		let invalid = ['__observers__', 'edit', 'name'];
		return !_.includes(invalid, name);
	}

}

import {BlockModel} from "../../../model/BlockModel";

export class Drops
{
	public block: BlockModel;

	activate(block: BlockModel) {
		this.block = block;
	}
}

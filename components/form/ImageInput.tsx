import { Label } from "../ui/label";
import { Input } from "../ui/input";

const name = "image";

function ImageInput() {
  return (
    <div className="mb-2">
      <Label htmlFor={name} className="capitalize">
        Image
      </Label>
      <Input type="file" name={name} id={name} required accept="image/*" />
    </div>
  );
}
export default ImageInput;

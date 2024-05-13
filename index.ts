import { getGroupById } from "./dbActions";
console.log(getGroupById(1));
getGroupById(1).then((res) => console.log(res));

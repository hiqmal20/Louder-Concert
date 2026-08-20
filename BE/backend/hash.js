import bcrypt from "bcryptjs";

const password = "Admin12345";
const hashed = await bcrypt.hash(password, 10);
console.log(hashed);

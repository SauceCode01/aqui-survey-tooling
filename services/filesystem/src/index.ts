import { createServer } from "node:http";

const port = process.env.PORT || 3001;

const server = createServer((req, res) => {
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(
		JSON.stringify({
			id: "real-file-999",
			status: "success",
			message: "Hello from the ACTUAL Filesystem Service!",
			url: "https://real.storage/file.png",
		}),
	);
});

server.listen(port, () => {
	console.log(`🚀 Real Filesystem API running on port ${port}`);
});

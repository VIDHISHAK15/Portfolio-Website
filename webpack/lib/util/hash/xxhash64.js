/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const create = require("./wasm-hash");

//#region wasm code: xxhash64 (../../../assembly/hash/xxhash64.asm.ts) --initialMemory 1
const xxhash64 = new WebAssembly.Module(
	Buffer.from(
		// 1168 bytes
		"AGFzbQEAAAABCAJgAX8AYAAAAwQDAQAABQMBAAEGGgV+AUIAC34BQgALfgFCAAt+AUIAC34BQgALByIEBGluaXQAAAZ1cGRhdGUAAQVmaW5hbAACBm1lbW9yeQIACrAIAzAAQtbrgu7q/Yn14AAkAELP1tO+0ser2UIkAUIAJAJC+erQ0OfJoeThACQDQgAkBAvUAQIBfwR+IABFBEAPCyMEIACtfCQEIwAhAiMBIQMjAiEEIwMhBQNAIAIgASkDAELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiECIAMgASkDCELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEDIAQgASkDEELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEEIAUgASkDGELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEFIAFBIGoiASAASQ0ACyACJAAgAyQBIAQkAiAFJAMLpgYCAn8EfiMEQgBSBH4jACIDQgGJIwEiBEIHiXwjAiIFQgyJfCMDIgZCEol8IANCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCh5Wvr5i23puef35CnaO16oOxjYr6AH0gBELP1tO+0ser2UJ+Qh+JQoeVr6+Ytt6bnn9+hUKHla+vmLbem55/fkKdo7Xqg7GNivoAfSAFQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef36FQoeVr6+Ytt6bnn9+Qp2jteqDsY2K+gB9IAZCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCh5Wvr5i23puef35CnaO16oOxjYr6AH0FQsXP2bLx5brqJwsjBCAArXx8IQMDQCABQQhqIgIgAE0EQCADIAEpAwBCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCG4lCh5Wvr5i23puef35CnaO16oOxjYr6AH0hAyACIQEMAQsLIAFBBGoiAiAATQRAIAMgATUCAEKHla+vmLbem55/foVCF4lCz9bTvtLHq9lCfkL5893xmfaZqxZ8IQMgAiEBCwNAIAAgAUcEQCADIAExAABCxc/ZsvHluuonfoVCC4lCh5Wvr5i23puef34hAyABQQFqIQEMAQsLQQAgAyADQiGIhULP1tO+0ser2UJ+IgNCHYggA4VC+fPd8Zn2masWfiIDQiCIIAOFIgNCIIgiBEL//wODQiCGIARCgID8/w+DQhCIhCIEQv+BgIDwH4NCEIYgBEKA/oOAgOA/g0IIiIQiBEKPgLyA8IHAB4NCCIYgBELwgcCHgJ6A+ACDQgSIhCIEQoaMmLDgwIGDBnxCBIhCgYKEiJCgwIABg0InfiAEQrDgwIGDhoyYMIR8NwMAQQggA0L/////D4MiA0L//wODQiCGIANCgID8/w+DQhCIhCIDQv+BgIDwH4NCEIYgA0KA/oOAgOA/g0IIiIQiA0KPgLyA8IHAB4NCCIYgA0LwgcCHgJ6A+ACDQgSIhCIDQoaMmLDgwIGDBnxCBIhCgYKEiJCgwIABg0InfiADQrDgwIGDhoyYMIR8NwMACw==",
		"base64"
	)
);
//#endregion

module.exports = create.bind(null, xxhash64, [], 32, 16);
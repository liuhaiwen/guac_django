var Guacamole = Guacamole || {};
Guacamole.ArrayBufferReader = function(b) {
	var a = this;
	b.onblob = function(f) {
		var g = window.atob(f);
		var d = new ArrayBuffer(g.length);
		var e = new Uint8Array(d);
		for (var c = 0; c < g.length; c++) {
			e[c] = g.charCodeAt(c)
		}
		if (a.ondata) {
			a.ondata(d)
		}
	};
	b.onend = function() {
		if (a.onend) {
			a.onend()
		}
	};
	this.ondata = null;
	this.onend = null
};
var Guacamole = Guacamole || {};
Guacamole.ArrayBufferWriter = function(c) {
	var b = this;
	c.onack = function(d) {
		if (b.onack) {
			b.onack(d)
		}
	};
	function a(d) {
		var f = "";
		for (var e = 0; e < d.byteLength; e++) {
			f += String.fromCharCode(d[e])
		}
		c.sendBlob(window.btoa(f))
	}
	this.blobLength = Guacamole.ArrayBufferWriter.DEFAULT_BLOB_LENGTH;
	this.sendData = function(e) {
		var d = new Uint8Array(e);
		if (d.length <= b.blobLength) {
			a(d)
		} else {
			for (var f = 0; f < d.length; f += b.blobLength) {
				a(d.subarray(f, f + b.blobLength))
			}
		}
	};
	this.sendEnd = function() {
		c.sendEnd()
	};
	this.onack = null
};
Guacamole.ArrayBufferWriter.DEFAULT_BLOB_LENGTH = 6048;
var Guacamole = Guacamole || {};
Guacamole.AudioContextFactory = {
	singleton: null,
	getAudioContext: function getAudioContext() {
		var b = window.AudioContext || window.webkitAudioContext;
		if (b) {
			try {
				if (!Guacamole.AudioContextFactory.singleton) {
					Guacamole.AudioContextFactory.singleton = new b()
				}
				return Guacamole.AudioContextFactory.singleton
			} catch(a) {}
		}
		return null
	}
};
var Guacamole = Guacamole || {};
Guacamole.AudioPlayer = function AudioPlayer() {
	this.sync = function a() {}
};
Guacamole.AudioPlayer.isSupportedType = function isSupportedType(a) {
	return Guacamole.RawAudioPlayer.isSupportedType(a)
};
Guacamole.AudioPlayer.getSupportedTypes = function getSupportedTypes() {
	return Guacamole.RawAudioPlayer.getSupportedTypes()
};
Guacamole.AudioPlayer.getInstance = function getInstance(b, a) {
	if (Guacamole.RawAudioPlayer.isSupportedType(a)) {
		return new Guacamole.RawAudioPlayer(b, a)
	}
	return null
};
Guacamole.RawAudioPlayer = function RawAudioPlayer(e, a) {
	var n = Guacamole.RawAudioFormat.parse(a);
	var d = Guacamole.AudioContextFactory.getAudioContext();
	var m = d.currentTime;
	var b = new Guacamole.ArrayBufferReader(e);
	var o = 0.02;
	var j = 0.3;
	var k = (n.bytesPerSample === 1) ? window.Int8Array: window.Int16Array;
	var i = (n.bytesPerSample === 1) ? 128 : 32768;
	var g = [];
	var f = function f(v) {
		if (v.length <= 1) {
			return v[0]
		}
		var x = 0;
		v.forEach(function s(y) {
			x += y.length
		});
		var w = 0;
		var t = new k(x);
		v.forEach(function u(y) {
			t.set(y, w);
			w += y.length
		});
		return t
	};
	var q = function q(v) {
		var z = Number.MAX_VALUE;
		var x = v.length;
		var y = Math.floor(v.length / n.channels);
		var A = Math.floor(n.rate * o);
		var s = Math.max(n.channels * A, n.channels * (y - A));
		for (var u = s; u < v.length; u += n.channels) {
			var t = 0;
			for (var w = 0; w < n.channels; w++) {
				t += Math.abs(v[u + w])
			}
			if (t <= z) {
				x = u + n.channels;
				z = t
			}
		}
		if (x === v.length) {
			return [v]
		}
		return [new k(v.buffer.slice(0, x * n.bytesPerSample)), new k(v.buffer.slice(x * n.bytesPerSample))]
	};
	var c = function c(s) {
		g.push(new k(s))
	};
	var r = function r() {
		var s = f(g);
		if (!s) {
			return null
		}
		g = q(s);
		s = g.shift();
		return s
	};
	var p = function p(y) {
		var u = y.length / n.channels;
		var s = d.currentTime;
		if (m < s) {
			m = s
		}
		var x = d.createBuffer(n.channels, u, n.rate);
		for (var w = 0; w < n.channels; w++) {
			var t = x.getChannelData(w);
			var z = w;
			for (var v = 0; v < u; v++) {
				t[v] = y[z] / i;
				z += n.channels
			}
		}
		return x
	};
	b.ondata = function l(u) {
		c(new k(u));
		var v = r();
		if (!v) {
			return
		}
		var s = d.currentTime;
		if (m < s) {
			m = s
		}
		var t = d.createBufferSource();
		t.connect(d.destination);
		if (!t.start) {
			t.start = t.noteOn
		}
		t.buffer = p(v);
		t.start(m);
		m += v.length / n.channels / n.rate
	};
	this.sync = function h() {
		var s = d.currentTime;
		m = Math.min(m, s + j)
	}
};
Guacamole.RawAudioPlayer.prototype = new Guacamole.AudioPlayer();
Guacamole.RawAudioPlayer.isSupportedType = function isSupportedType(a) {
	if (!Guacamole.AudioContextFactory.getAudioContext()) {
		return false
	}
	return Guacamole.RawAudioFormat.parse(a) !== null
};
Guacamole.RawAudioPlayer.getSupportedTypes = function getSupportedTypes() {
	if (!Guacamole.AudioContextFactory.getAudioContext()) {
		return []
	}
	return ["audio/L8", "audio/L16"]
};
var Guacamole = Guacamole || {};
Guacamole.AudioRecorder = function AudioRecorder() {
	this.onclose = null;
	this.onerror = null
};
Guacamole.AudioRecorder.isSupportedType = function isSupportedType(a) {
	return Guacamole.RawAudioRecorder.isSupportedType(a)
};
Guacamole.AudioRecorder.getSupportedTypes = function getSupportedTypes() {
	return Guacamole.RawAudioRecorder.getSupportedTypes()
};
Guacamole.AudioRecorder.getInstance = function getInstance(b, a) {
	if (Guacamole.RawAudioRecorder.isSupportedType(a)) {
		return new Guacamole.RawAudioRecorder(b, a)
	}
	return null
};
Guacamole.RawAudioRecorder = function RawAudioRecorder(f, a) {
	var e = this;
	var x = 2048;
	var j = 3;
	var u = Guacamole.RawAudioFormat.parse(a);
	var c = Guacamole.AudioContextFactory.getAudioContext();
	var l = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia).bind(navigator);
	var t = new Guacamole.ArrayBufferWriter(f);
	var r = (u.bytesPerSample === 1) ? window.Int8Array: window.Int16Array;
	var m = (u.bytesPerSample === 1) ? 128 : 32768;
	var w = 0;
	var v = 0;
	var s = null;
	var q = null;
	var d = null;
	var p = function p(y) {
		if (y === 0) {
			return 1
		}
		var z = Math.PI * y;
		return Math.sin(z) / z
	};
	var i = function i(y, z) {
		if ( - z < y && y < z) {
			return p(y) * p(y / z)
		}
		return 0
	};
	var o = function n(A, C) {
		var z = (A.length - 1) * C;
		var E = Math.floor(z) - j + 1;
		var y = Math.floor(z) + j;
		var D = 0;
		for (var B = E; B <= y; B++) {
			D += (A[B] || 0) * i(z - B, j)
		}
		return D
	};
	var g = function g(E) {
		var y = E.length;
		w += y;
		var F = Math.round(w * u.rate / E.sampleRate);
		var G = F - v;
		v += G;
		var B = new r(G * u.channels);
		for (var C = 0; C < u.channels; C++) {
			var D = E.getChannelData(C);
			var z = C;
			for (var A = 0; A < G; A++) {
				B[z] = o(D, A / (G - 1)) * m;
				z += u.channels
			}
		}
		return B
	};
	var h = function h() {
		l({
			audio: true
		},
		function z(B) {
			d = c.createScriptProcessor(x, u.channels, u.channels);
			d.connect(c.destination);
			d.onaudioprocess = function A(C) {
				t.sendData(g(C.inputBuffer).buffer)
			};
			q = c.createMediaStreamSource(B);
			q.connect(d);
			s = B
		},
		function y() {
			t.sendEnd();
			if (e.onerror) {
				e.onerror()
			}
		})
	};
	var k = function k() {
		if (q) {
			q.disconnect()
		}
		if (d) {
			d.disconnect()
		}
		if (s) {
			var y = s.getTracks();
			for (var z = 0; z < y.length; z++) {
				y[z].stop()
			}
		}
		d = null;
		q = null;
		s = null;
		t.sendEnd()
	};
	t.onack = function b(y) {
		if (y.code === Guacamole.Status.Code.SUCCESS && !s) {
			h()
		} else {
			k();
			t.onack = null;
			if (y.code === Guacamole.Status.Code.RESOURCE_CLOSED) {
				if (e.onclose) {
					e.onclose()
				}
			} else {
				if (e.onerror) {
					e.onerror()
				}
			}
		}
	}
};
Guacamole.RawAudioRecorder.prototype = new Guacamole.AudioRecorder();
Guacamole.RawAudioRecorder.isSupportedType = function isSupportedType(a) {
	if (!Guacamole.AudioContextFactory.getAudioContext()) {
		return false
	}
	return Guacamole.RawAudioFormat.parse(a) !== null
};
Guacamole.RawAudioRecorder.getSupportedTypes = function getSupportedTypes() {
	if (!Guacamole.AudioContextFactory.getAudioContext()) {
		return []
	}
	return ["audio/L8", "audio/L16"]
};
var Guacamole = Guacamole || {};
Guacamole.BlobReader = function(e, a) {
	var d = this;
	var c = 0;
	var b;
	if (window.BlobBuilder) {
		b = new BlobBuilder()
	} else {
		if (window.WebKitBlobBuilder) {
			b = new WebKitBlobBuilder()
		} else {
			if (window.MozBlobBuilder) {
				b = new MozBlobBuilder()
			} else {
				b = new(function() {
					var f = [];
					this.append = function(g) {
						f.push(new Blob([g], {
							type: a
						}))
					};
					this.getBlob = function() {
						return new Blob(f, {
							type: a
						})
					}
				})()
			}
		}
	}
	e.onblob = function(j) {
		var k = window.atob(j);
		var g = new ArrayBuffer(k.length);
		var h = new Uint8Array(g);
		for (var f = 0; f < k.length; f++) {
			h[f] = k.charCodeAt(f)
		}
		b.append(g);
		c += g.byteLength;
		if (d.onprogress) {
			d.onprogress(g.byteLength)
		}
		e.sendAck("OK", 0)
	};
	e.onend = function() {
		if (d.onend) {
			d.onend()
		}
	};
	this.getLength = function() {
		return c
	};
	this.getBlob = function() {
		return b.getBlob()
	};
	this.onprogress = null;
	this.onend = null
};
var Guacamole = Guacamole || {};
Guacamole.BlobWriter = function BlobWriter(d) {
	var f = this;
	var a = new Guacamole.ArrayBufferWriter(d);
	a.onack = function(g) {
		if (f.onack) {
			f.onack(g)
		}
	};
	var c = function c(h, l, g) {
		var i = (h.slice || h.webkitSlice || h.mozSlice).bind(h);
		var j = g - l;
		if (j !== g) {
			var k = i(l, j);
			if (k.size === j) {
				return k
			}
		}
		return i(l, g)
	};
	this.sendBlob = function b(i) {
		var l = 0;
		var g = new FileReader();
		var k = function k() {
			if (l >= i.size) {
				if (f.oncomplete) {
					f.oncomplete(i)
				}
				return
			}
			var m = c(i, l, l + a.blobLength);
			l += a.blobLength;
			g.readAsArrayBuffer(m)
		};
		g.onload = function h() {
			a.sendData(g.result);
			a.onack = function m(n) {
				if (f.onack) {
					f.onack(n)
				}
				if (n.isError()) {
					return
				}
				if (f.onprogress) {
					f.onprogress(i, l - a.blobLength)
				}
				k()
			}
		};
		g.onerror = function j() {
			if (f.onerror) {
				f.onerror(i, l, g.error)
			}
		};
		k()
	};
	this.sendEnd = function e() {
		a.sendEnd()
	};
	this.onack = null;
	this.onerror = null;
	this.onprogress = null;
	this.oncomplete = null
};
var Guacamole = Guacamole || {};
Guacamole.Client = function(h) {
	var q = this;
	var v = 0;
	var c = 1;
	var z = 2;
	var x = 3;
	var n = 4;
	var J = 5;
	var s = v;
	var E = 0;
	var t = null;
	var j = {
		0 : "butt",
		1 : "round",
		2 : "square"
	};
	var K = {
		0 : "bevel",
		1 : "miter",
		2 : "round"
	};
	var u = new Guacamole.Display();
	var B = {};
	var w = {};
	var F = {};
	var k = [];
	var r = [];
	var C = [];
	var G = new Guacamole.IntegerPool();
	var L = [];
	function H(N) {
		if (N != s) {
			s = N;
			if (q.onstatechange) {
				q.onstatechange(s)
			}
		}
	}
	function y() {
		return s == x || s == z
	}
	this.exportState = function o(R) {
		var P = {
			currentState: s,
			currentTimestamp: E,
			layers: {}
		};
		var N = {};
		for (var O in B) {
			N[O] = B[O]
		}
		u.flush(function Q() {
			for (var V in N) {
				var T = parseInt(V);
				var U = N[V];
				var S = U.toCanvas();
				var W = {
					width: U.width,
					height: U.height
				};
				if (U.width && U.height) {
					W.url = S.toDataURL("image/png")
				}
				if (T > 0) {
					W.x = U.x;
					W.y = U.y;
					W.z = U.z;
					W.alpha = U.alpha;
					W.matrix = U.matrix;
					W.parent = m(U.parent)
				}
				P.layers[V] = W
			}
			R(P)
		})
	};
	this.importState = function D(S, U) {
		var Q;
		var O;
		s = S.currentState;
		E = S.currentTimestamp;
		for (Q in B) {
			O = parseInt(Q);
			if (O > 0) {
				u.dispose(B[Q])
			}
		}
		B = {};
		for (Q in S.layers) {
			O = parseInt(Q);
			var T = S.layers[Q];
			var P = b(O);
			u.resize(P, T.width, T.height);
			if (T.url) {
				u.setChannelMask(P, Guacamole.Layer.SRC);
				u.draw(P, 0, 0, T.url)
			}
			if (O > 0 && T.parent >= 0) {
				var R = b(T.parent);
				u.move(P, R, T.x, T.y, T.z);
				u.shade(P, T.alpha);
				var N = T.matrix;
				u.distort(P, N[0], N[1], N[2], N[3], N[4], N[5])
			}
		}
		u.flush(U)
	};
	this.getDisplay = function() {
		return u
	};
	this.sendSize = function(O, N) {
		if (!y()) {
			return
		}
		h.sendMessage("size", O, N)
	};
	this.sendKeyEvent = function(N, O) {
		if (!y()) {
			return
		}
		h.sendMessage("key", O, N)
	};
	this.sendMouseState = function(O) {
		if (!y()) {
			return
		}
		u.moveCursor(Math.floor(O.x), Math.floor(O.y));
		var N = 0;
		if (O.left) {
			N |= 1
		}
		if (O.middle) {
			N |= 2
		}
		if (O.right) {
			N |= 4
		}
		if (O.up) {
			N |= 8
		}
		if (O.down) {
			N |= 16
		}
		h.sendMessage("mouse", Math.floor(O.x), Math.floor(O.y), N)
	};
	this.setClipboard = function(P) {
		if (!y()) {
			return
		}
		var Q = q.createClipboardStream("text/plain");
		var O = new Guacamole.StringWriter(Q);
		for (var N = 0; N < P.length; N += 4096) {
			O.sendText(P.substring(N, N + 4096))
		}
		O.sendEnd()
	};
	this.createOutputStream = function l() {
		var N = G.next();
		var O = L[N] = new Guacamole.OutputStream(q, N);
		return O
	};
	this.createAudioStream = function(N) {
		var O = q.createOutputStream();
		h.sendMessage("audio", O.index, N);
		return O
	};
	this.createFileStream = function(N, O) {
		var P = q.createOutputStream();
		h.sendMessage("file", P.index, N, O);
		return P
	};
	this.createPipeStream = function(N, O) {
		var P = q.createOutputStream();
		h.sendMessage("pipe", P.index, N, O);
		return P
	};
	this.createClipboardStream = function(N) {
		var O = q.createOutputStream();
		h.sendMessage("clipboard", O.index, N);
		return O
	};
	this.createObjectOutputStream = function p(P, N, O) {
		var Q = q.createOutputStream();
		h.sendMessage("put", P, Q.index, N, O);
		return Q
	};
	this.requestObjectInputStream = function d(O, N) {
		if (!y()) {
			return
		}
		h.sendMessage("get", O, N)
	};
	this.sendAck = function(N, P, O) {
		if (!y()) {
			return
		}
		h.sendMessage("ack", N, P, O)
	};
	this.sendBlob = function(N, O) {
		if (!y()) {
			return
		}
		h.sendMessage("blob", N, O)
	};
	this.endStream = function(N) {
		if (!y()) {
			return
		}
		h.sendMessage("end", N);
		if (L[N]) {
			G.free(N);
			delete L[N]
		}
	};
	this.onstatechange = null;
	this.onname = null;
	this.onerror = null;
	this.onaudio = null;
	this.onvideo = null;
	this.onclipboard = null;
	this.onfile = null;
	this.onfilesystem = null;
	this.onpipe = null;
	this.onsync = null;
	var b = function b(N) {
		var O = B[N];
		if (!O) {
			if (N === 0) {
				O = u.getDefaultLayer()
			} else {
				if (N > 0) {
					O = u.createLayer()
				} else {
					O = u.createBuffer()
				}
			}
			B[N] = O
		}
		return O
	};
	var m = function m(O) {
		if (!O) {
			return null
		}
		for (var N in B) {
			if (O === B[N]) {
				return parseInt(N)
			}
		}
		return null
	};
	function g(N) {
		var O = k[N];
		if (O == null) {
			O = k[N] = new Guacamole.Parser();
			O.oninstruction = h.oninstruction
		}
		return O
	}
	var a = {
		"miter-limit": function(N, O) {
			u.setMiterLimit(N, parseFloat(O))
		}
	};
	var f = {
		ack: function(O) {
			var R = parseInt(O[0]);
			var P = O[1];
			var N = parseInt(O[2]);
			var Q = L[R];
			if (Q) {
				if (Q.onack) {
					Q.onack(new Guacamole.Status(N, P))
				}
				if (N >= 256 && L[R] === Q) {
					G.free(R);
					delete L[R]
				}
			}
		},
		arc: function(T) {
			var S = b(parseInt(T[0]));
			var O = parseInt(T[1]);
			var U = parseInt(T[2]);
			var N = parseInt(T[3]);
			var R = parseFloat(T[4]);
			var P = parseFloat(T[5]);
			var Q = parseInt(T[6]);
			u.arc(S, O, U, N, R, P, Q != 0)
		},
		audio: function(P) {
			var R = parseInt(P[0]);
			var O = P[1];
			var Q = r[R] = new Guacamole.InputStream(q, R);
			var N = null;
			if (q.onaudio) {
				N = q.onaudio(Q, O)
			}
			if (!N) {
				N = Guacamole.AudioPlayer.getInstance(Q, O)
			}
			if (N) {
				w[R] = N;
				q.sendAck(R, "OK", 0)
			} else {
				q.sendAck(R, "BAD TYPE", 783)
			}
		},
		blob: function(N) {
			var Q = parseInt(N[0]);
			var O = N[1];
			var P = r[Q];
			if (P && P.onblob) {
				P.onblob(O)
			}
		},
		body: function i(Q) {
			var R = parseInt(Q[0]);
			var P = C[R];
			var T = parseInt(Q[1]);
			var N = Q[2];
			var O = Q[3];
			if (P && P.onbody) {
				var S = r[T] = new Guacamole.InputStream(q, T);
				P.onbody(S, N, O)
			} else {
				q.sendAck(T, "Receipt of body unsupported", 256)
			}
		},
		cfill: function(S) {
			var T = parseInt(S[0]);
			var P = b(parseInt(S[1]));
			var R = parseInt(S[2]);
			var Q = parseInt(S[3]);
			var N = parseInt(S[4]);
			var O = parseInt(S[5]);
			u.setChannelMask(P, T);
			u.fillColor(P, R, Q, N, O)
		},
		clip: function(O) {
			var N = b(parseInt(O[0]));
			u.clip(N)
		},
		clipboard: function(O) {
			var Q = parseInt(O[0]);
			var N = O[1];
			if (q.onclipboard) {
				var P = r[Q] = new Guacamole.InputStream(q, Q);
				q.onclipboard(P, N)
			} else {
				q.sendAck(Q, "Clipboard unsupported", 256)
			}
		},
		close: function(O) {
			var N = b(parseInt(O[0]));
			u.close(N)
		},
		copy: function(V) {
			var N = b(parseInt(V[0]));
			var R = parseInt(V[1]);
			var Q = parseInt(V[2]);
			var P = parseInt(V[3]);
			var W = parseInt(V[4]);
			var U = parseInt(V[5]);
			var O = b(parseInt(V[6]));
			var T = parseInt(V[7]);
			var S = parseInt(V[8]);
			u.setChannelMask(O, U);
			u.copy(N, R, Q, P, W, O, T, S)
		},
		cstroke: function(V) {
			var S = parseInt(V[0]);
			var Q = b(parseInt(V[1]));
			var W = j[parseInt(V[2])];
			var O = K[parseInt(V[3])];
			var U = parseInt(V[4]);
			var N = parseInt(V[5]);
			var P = parseInt(V[6]);
			var R = parseInt(V[7]);
			var T = parseInt(V[8]);
			u.setChannelMask(Q, S);
			u.strokeColor(Q, W, O, U, N, P, R, T)
		},
		cursor: function(U) {
			var T = parseInt(U[0]);
			var S = parseInt(U[1]);
			var Q = b(parseInt(U[2]));
			var O = parseInt(U[3]);
			var N = parseInt(U[4]);
			var R = parseInt(U[5]);
			var P = parseInt(U[6]);
			u.setCursor(T, S, Q, O, N, R, P)
		},
		curve: function(T) {
			var S = b(parseInt(T[0]));
			var P = parseInt(T[1]);
			var O = parseInt(T[2]);
			var R = parseInt(T[3]);
			var Q = parseInt(T[4]);
			var N = parseInt(T[5]);
			var U = parseInt(T[6]);
			u.curveTo(S, P, O, R, Q, N, U)
		},
		disconnect: function e(N) {
			q.disconnect()
		},
		dispose: function(P) {
			var N = parseInt(P[0]);
			if (N > 0) {
				var O = b(N);
				u.dispose(O);
				delete B[N]
			} else {
				if (N < 0) {
					delete B[N]
				}
			}
		},
		distort: function(V) {
			var N = parseInt(V[0]);
			var U = parseFloat(V[1]);
			var T = parseFloat(V[2]);
			var S = parseFloat(V[3]);
			var R = parseFloat(V[4]);
			var Q = parseFloat(V[5]);
			var P = parseFloat(V[6]);
			if (N >= 0) {
				var O = b(N);
				u.distort(O, U, T, S, R, Q, P)
			}
		},
		error: function(O) {
			var P = O[0];
			var N = parseInt(O[1]);
			if (q.onerror) {
				q.onerror(new Guacamole.Status(N, P))
			}
			q.disconnect()
		},
		end: function(N) {
			var P = parseInt(N[0]);
			var O = r[P];
			if (O) {
				if (O.onend) {
					O.onend()
				}
				delete r[P]
			}
		},
		file: function(P) {
			var R = parseInt(P[0]);
			var N = P[1];
			var O = P[2];
			if (q.onfile) {
				var Q = r[R] = new Guacamole.InputStream(q, R);
				q.onfile(Q, N, O)
			} else {
				q.sendAck(R, "File transfer unsupported", 256)
			}
		},
		filesystem: function A(P) {
			var Q = parseInt(P[0]);
			var O = P[1];
			if (q.onfilesystem) {
				var N = C[Q] = new Guacamole.Object(q, Q);
				q.onfilesystem(N, O)
			}
		},
		identity: function(O) {
			var N = b(parseInt(O[0]));
			u.setTransform(N, 1, 0, 0, 1, 0, 0)
		},
		img: function(W) {
			var N = parseInt(W[0]);
			var R = parseInt(W[1]);
			var Q = b(parseInt(W[2]));
			var T = W[3];
			var U = parseInt(W[4]);
			var S = parseInt(W[5]);
			var V = r[N] = new Guacamole.InputStream(q, N);
			var P = new Guacamole.DataURIReader(V, T);
			P.onend = function O() {
				u.setChannelMask(Q, R);
				u.draw(Q, U, S, P.getURI())
			}
		},
		jpeg: function(P) {
			var S = parseInt(P[0]);
			var O = b(parseInt(P[1]));
			var N = parseInt(P[2]);
			var R = parseInt(P[3]);
			var Q = P[4];
			u.setChannelMask(O, S);
			u.draw(O, N, R, "data:image/jpeg;base64," + Q)
		},
		lfill: function(P) {
			var Q = parseInt(P[0]);
			var O = b(parseInt(P[1]));
			var N = b(parseInt(P[2]));
			u.setChannelMask(O, Q);
			u.fillLayer(O, N)
		},
		line: function(P) {
			var O = b(parseInt(P[0]));
			var N = parseInt(P[1]);
			var Q = parseInt(P[2]);
			u.lineTo(O, N, Q)
		},
		lstroke: function(P) {
			var Q = parseInt(P[0]);
			var O = b(parseInt(P[1]));
			var N = b(parseInt(P[2]));
			u.setChannelMask(O, Q);
			u.strokeLayer(O, N)
		},
		mouse: function M(O) {
			var N = parseInt(O[0]);
			var P = parseInt(O[1]);
			u.showCursor(true);
			u.moveCursor(N, P)
		},
		move: function(S) {
			var O = parseInt(S[0]);
			var P = parseInt(S[1]);
			var N = parseInt(S[2]);
			var U = parseInt(S[3]);
			var T = parseInt(S[4]);
			if (O > 0 && P >= 0) {
				var Q = b(O);
				var R = b(P);
				u.move(Q, R, N, U, T)
			}
		},
		name: function(N) {
			if (q.onname) {
				q.onname(N[0])
			}
		},
		nest: function(N) {
			var O = g(parseInt(N[0]));
			O.receive(N[1])
		},
		pipe: function(P) {
			var R = parseInt(P[0]);
			var N = P[1];
			var O = P[2];
			if (q.onpipe) {
				var Q = r[R] = new Guacamole.InputStream(q, R);
				q.onpipe(Q, N, O)
			} else {
				q.sendAck(R, "Named pipes unsupported", 256)
			}
		},
		png: function(P) {
			var S = parseInt(P[0]);
			var O = b(parseInt(P[1]));
			var N = parseInt(P[2]);
			var R = parseInt(P[3]);
			var Q = P[4];
			u.setChannelMask(O, S);
			u.draw(O, N, R, "data:image/png;base64," + Q)
		},
		pop: function(O) {
			var N = b(parseInt(O[0]));
			u.pop(N)
		},
		push: function(O) {
			var N = b(parseInt(O[0]));
			u.push(N)
		},
		rect: function(R) {
			var P = b(parseInt(R[0]));
			var N = parseInt(R[1]);
			var S = parseInt(R[2]);
			var O = parseInt(R[3]);
			var Q = parseInt(R[4]);
			u.rect(P, N, S, O, Q)
		},
		reset: function(O) {
			var N = b(parseInt(O[0]));
			u.reset(N)
		},
		set: function(Q) {
			var O = b(parseInt(Q[0]));
			var N = Q[1];
			var R = Q[2];
			var P = a[N];
			if (P) {
				P(O, R)
			}
		},
		shade: function(Q) {
			var N = parseInt(Q[0]);
			var O = parseInt(Q[1]);
			if (N >= 0) {
				var P = b(N);
				u.shade(P, O)
			}
		},
		size: function(R) {
			var O = parseInt(R[0]);
			var P = b(O);
			var Q = parseInt(R[1]);
			var N = parseInt(R[2]);
			u.resize(P, Q, N)
		},
		start: function(P) {
			var O = b(parseInt(P[0]));
			var N = parseInt(P[1]);
			var Q = parseInt(P[2]);
			u.moveTo(O, N, Q)
		},
		sync: function(O) {
			var P = parseInt(O[0]);
			u.flush(function N() {
				for (var R in w) {
					var Q = w[R];
					if (Q) {
						Q.sync()
					}
				}
				if (P !== E) {
					h.sendMessage("sync", P);
					E = P
				}
			});
			if (s === z) {
				H(x)
			}
			if (q.onsync) {
				q.onsync(P)
			}
		},
		transfer: function(V) {
			var N = b(parseInt(V[0]));
			var S = parseInt(V[1]);
			var R = parseInt(V[2]);
			var Q = parseInt(V[3]);
			var W = parseInt(V[4]);
			var P = parseInt(V[5]);
			var O = b(parseInt(V[6]));
			var U = parseInt(V[7]);
			var T = parseInt(V[8]);
			if (P === 3) {
				u.put(N, S, R, Q, W, O, U, T)
			} else {
				if (P !== 5) {
					u.transfer(N, S, R, Q, W, O, U, T, Guacamole.Client.DefaultTransferFunction[P])
				}
			}
		},
		transform: function(Q) {
			var P = b(parseInt(Q[0]));
			var O = parseFloat(Q[1]);
			var N = parseFloat(Q[2]);
			var U = parseFloat(Q[3]);
			var T = parseFloat(Q[4]);
			var S = parseFloat(Q[5]);
			var R = parseFloat(Q[6]);
			u.transform(P, O, N, U, T, S, R)
		},
		undefine: function I(O) {
			var P = parseInt(O[0]);
			var N = C[P];
			if (N && N.onundefine) {
				N.onundefine()
			}
		},
		video: function(Q) {
			var S = parseInt(Q[0]);
			var O = b(parseInt(Q[1]));
			var N = Q[2];
			var R = r[S] = new Guacamole.InputStream(q, S);
			var P = null;
			if (q.onvideo) {
				P = q.onvideo(R, O, N)
			}
			if (!P) {
				P = Guacamole.VideoPlayer.getInstance(R, O, N)
			}
			if (P) {
				F[S] = P;
				q.sendAck(S, "OK", 0)
			} else {
				q.sendAck(S, "BAD TYPE", 783)
			}
		},
		toastr: function(Q) {	// ?????????????????????
			// toastr.options.closeButton = true;
			toastr.options.showMethod = 'slideDown';
			toastr.options.hideMethod = 'fadeOut';
			toastr.options.closeMethod = 'fadeOut';
			toastr.options.timeOut = 0;	
			toastr.options.extendedTimeOut = 0;	
			toastr.options.progressBar = true;
			toastr.options.positionClass = 'toast-top-right';
			var data = decodeURIComponent(escape(window.atob(Q[1])));	// ??????base64???????????????
			if (Q[0] == 0) {
				toastr.success(data);	// ??????
				$(".session-close").attr("hidden", false);
			} else if (Q[0] == 1) {
				toastr.warning(data);	// ??????
				$(".session-close").attr("hidden", true);
			} else if (Q[0] == 2) {
				toastr.error(data);
				$(".session-close").attr("hidden", true);
				$("body").removeAttr("onbeforeunload"); //??????????????????????????????
			} else {
				toastr.info(data);
			}
		},
		group: function(Q) {	// ????????????????????????????????????????????? group ???????????????????????????????????? guacd ???????????????
			var lable = Q[0];
			var data = Q[1];
			$("#" + lable).attr("text", data);
		},
		display: function(Q) {	// ?????????????????????
			toastr.options.closeButton = false;
			toastr.options.showMethod = 'slideDown';
			toastr.options.hideMethod = 'fadeOut';
			toastr.options.closeMethod = 'fadeOut';
			toastr.options.timeOut = 5000;
			toastr.options.extendedTimeOut = 3000;
			toastr.options.positionClass = 'toast-bottom-center';
			toastr.info('?????????: ' + Q[0] + ' x ' + Q[1] + ', DPI: ' + Q[2]);
		},
	};
	h.oninstruction = function(P, O) {
		var N = f[P];
		if (N) {
			N(O)
		}
	};
	this.disconnect = function() {
		if (s != J && s != n) {
			H(n);
			if (t) {
				window.clearInterval(t)
			}
			h.sendMessage("disconnect");
			h.disconnect();
			H(J)
		}
	};
	this.connect = function(O) {
		H(c);
		try {
			h.connect(O)
		} catch(N) {
			H(v);
			throw N
		}
		t = window.setInterval(function() {
			h.sendMessage("nop")
		},
		5000);
		H(z)
	}
};
Guacamole.Client.DefaultTransferFunction = {
	0 : function(a, b) {
		b.red = b.green = b.blue = 0
	},
	15 : function(a, b) {
		b.red = b.green = b.blue = 255
	},
	3 : function(a, b) {
		b.red = a.red;
		b.green = a.green;
		b.blue = a.blue;
		b.alpha = a.alpha
	},
	5 : function(a, b) {},
	12 : function(a, b) {
		b.red = 255 & ~a.red;
		b.green = 255 & ~a.green;
		b.blue = 255 & ~a.blue;
		b.alpha = a.alpha
	},
	10 : function(a, b) {
		b.red = 255 & ~b.red;
		b.green = 255 & ~b.green;
		b.blue = 255 & ~b.blue
	},
	1 : function(a, b) {
		b.red = (a.red & b.red);
		b.green = (a.green & b.green);
		b.blue = (a.blue & b.blue)
	},
	14 : function(a, b) {
		b.red = 255 & ~ (a.red & b.red);
		b.green = 255 & ~ (a.green & b.green);
		b.blue = 255 & ~ (a.blue & b.blue)
	},
	7 : function(a, b) {
		b.red = (a.red | b.red);
		b.green = (a.green | b.green);
		b.blue = (a.blue | b.blue)
	},
	8 : function(a, b) {
		b.red = 255 & ~ (a.red | b.red);
		b.green = 255 & ~ (a.green | b.green);
		b.blue = 255 & ~ (a.blue | b.blue)
	},
	6 : function(a, b) {
		b.red = (a.red ^ b.red);
		b.green = (a.green ^ b.green);
		b.blue = (a.blue ^ b.blue)
	},
	9 : function(a, b) {
		b.red = 255 & ~ (a.red ^ b.red);
		b.green = 255 & ~ (a.green ^ b.green);
		b.blue = 255 & ~ (a.blue ^ b.blue)
	},
	4 : function(a, b) {
		b.red = 255 & (~a.red & b.red);
		b.green = 255 & (~a.green & b.green);
		b.blue = 255 & (~a.blue & b.blue)
	},
	13 : function(a, b) {
		b.red = 255 & (~a.red | b.red);
		b.green = 255 & (~a.green | b.green);
		b.blue = 255 & (~a.blue | b.blue)
	},
	2 : function(a, b) {
		b.red = 255 & (a.red & ~b.red);
		b.green = 255 & (a.green & ~b.green);
		b.blue = 255 & (a.blue & ~b.blue)
	},
	11 : function(a, b) {
		b.red = 255 & (a.red | ~b.red);
		b.green = 255 & (a.green | ~b.green);
		b.blue = 255 & (a.blue | ~b.blue)
	}
};
var Guacamole = Guacamole || {};
Guacamole.DataURIReader = function(g, b) {
	var f = this;
	var e = "data:" + b + ";base64,";
	g.onblob = function a(h) {
		e += h
	};
	g.onend = function c() {
		if (f.onend) {
			f.onend()
		}
	};
	this.getURI = function d() {
		return e
	};
	this.onend = null
};
var Guacamole = Guacamole || {};
Guacamole.Display = function() {
	var b = this;
	var f = 0;
	var c = 0;
	var k = 1;
	var m = document.createElement("div");
	m.style.position = "relative";
	m.style.width = f + "px";
	m.style.height = c + "px";
	m.style.transformOrigin = m.style.webkitTransformOrigin = m.style.MozTransformOrigin = m.style.OTransformOrigin = m.style.msTransformOrigin = "0 0";
	var e = new Guacamole.Display.VisibleLayer(f, c);
	var d = new Guacamole.Display.VisibleLayer(0, 0);
	d.setChannelMask(Guacamole.Layer.SRC);
	m.appendChild(e.getElement());
	m.appendChild(d.getElement());
	var h = document.createElement("div");
	h.style.position = "relative";
	h.style.width = (f * k) + "px";
	h.style.height = (c * k) + "px";
	h.appendChild(m);
	this.cursorHotspotX = 0;
	this.cursorHotspotY = 0;
	this.cursorX = 0;
	this.cursorY = 0;
	this.onresize = null;
	this.oncursor = null;
	var j = [];
	var i = [];
	function g() {
		var s = 0;
		while (s < i.length) {
			var t = i[s];
			if (!t.isReady()) {
				break
			}
			t.flush();
			s++
		}
		i.splice(0, s)
	}
	function n(t, s) {
		this.isReady = function() {
			for (var u = 0; u < s.length; u++) {
				if (s[u].blocked) {
					return false
				}
			}
			return true
		};
		this.flush = function() {
			for (var u = 0; u < s.length; u++) {
				s[u].execute()
			}
			if (t) {
				t()
			}
		}
	}
	function a(u, t) {
		var s = this;
		this.blocked = t;
		this.unblock = function() {
			if (s.blocked) {
				s.blocked = false;
				g()
			}
		};
		this.execute = function() {
			if (u) {
				u()
			}
		}
	}
	function p(u, t) {
		var s = new a(u, t);
		j.push(s);
		return s
	}
	this.getElement = function() {
		return h
	};
	this.getWidth = function() {
		return f
	};
	this.getHeight = function() {
		return c
	};
	this.getDefaultLayer = function() {
		return e
	};
	this.getCursorLayer = function() {
		return d
	};
	this.createLayer = function() {
		var s = new Guacamole.Display.VisibleLayer(f, c);
		s.move(e, 0, 0, 0);
		return s
	};
	this.createBuffer = function() {
		var s = new Guacamole.Layer(0, 0);
		s.autosize = 1;
		return s
	};
	this.flush = function(s) {
		i.push(new n(s, j));
		j = [];
		g()
	};
	this.setCursor = function(y, w, x, t, s, v, z) {
		p(function u() {
			b.cursorHotspotX = y;
			b.cursorHotspotY = w;
			d.resize(v, z);
			d.copy(x, t, s, v, z, 0, 0);
			b.moveCursor(b.cursorX, b.cursorY);
			if (b.oncursor) {
				b.oncursor(d.toCanvas(), y, w)
			}
		})
	};
	this.showCursor = function(u) {
		var s = d.getElement();
		var t = s.parentNode;
		if (u === false) {
			if (t) {
				t.removeChild(s)
			}
		} else {
			if (t !== m) {
				m.appendChild(s)
			}
		}
	};
	this.moveCursor = function(s, t) {
		d.translate(s - b.cursorHotspotX, t - b.cursorHotspotY);
		b.cursorX = s;
		b.cursorY = t
	};
	this.resize = function(t, u, s) {
		p(function v() {
			t.resize(u, s);
			if (t === e) {
				f = u;
				c = s;
				m.style.width = f + "px";
				m.style.height = c + "px";
				h.style.width = (f * k) + "px";
				h.style.height = (c * k) + "px";
				if (b.onresize) {
					b.onresize(u, s)
				}
			}
		})
	};
	this.drawImage = function(u, s, w, v) {
		p(function t() {
			u.drawImage(s, w, v)
		})
	};
	this.drawBlob = function(z, t, B, v) {
		var w = URL.createObjectURL(v);
		var u = p(function s() {
			if (A.width && A.height) {
				z.drawImage(t, B, A)
			}
			URL.revokeObjectURL(w)
		},
		true);
		var A = new Image();
		A.onload = u.unblock;
		A.onerror = u.unblock;
		A.src = w
	};
	this.draw = function(w, s, A, v) {
		var u = p(function t() {
			if (z.width && z.height) {
				w.drawImage(s, A, z)
			}
		},
		true);
		var z = new Image();
		z.onload = u.unblock;
		z.onerror = u.unblock;
		z.src = v
	};
	this.play = function(u, s, w, t) {
		var v = document.createElement("video");
		v.type = s;
		v.src = t;
		v.addEventListener("play",
		function() {
			function x() {
				u.drawImage(0, 0, v);
				if (!v.ended) {
					window.setTimeout(x, 20)
				}
			}
			x()
		},
		false);
		p(v.play)
	};
	this.transfer = function(A, t, s, u, D, w, B, z, v) {
		p(function C() {
			w.transfer(A, t, s, u, D, B, z, v)
		})
	};
	this.put = function(A, t, s, u, C, w, B, z) {
		p(function v() {
			w.put(A, t, s, u, C, B, z)
		})
	};
	this.copy = function(A, t, s, u, C, v, B, z) {
		p(function w() {
			v.copy(A, t, s, u, C, B, z)
		})
	};
	this.moveTo = function(u, s, v) {
		p(function t() {
			u.moveTo(s, v)
		})
	};
	this.lineTo = function(u, s, v) {
		p(function t() {
			u.lineTo(s, v)
		})
	};
	this.arc = function(A, t, B, s, z, u, w) {
		p(function v() {
			A.arc(t, B, s, z, u, w)
		})
	};
	this.curveTo = function(z, u, t, w, v, s, B) {
		p(function A() {
			z.curveTo(u, t, w, v, s, B)
		})
	};
	this.close = function(s) {
		p(function t() {
			s.close()
		})
	};
	this.rect = function(u, s, A, t, v) {
		p(function z() {
			u.rect(s, A, t, v)
		})
	};
	this.clip = function(s) {
		p(function t() {
			s.clip()
		})
	};
	this.strokeColor = function(v, z, t, x, s, u, w, y) {
		p(function A() {
			v.strokeColor(z, t, x, s, u, w, y)
		})
	};
	this.fillColor = function(u, w, v, s, t) {
		p(function x() {
			u.fillColor(w, v, s, t)
		})
	};
	this.strokeLayer = function(w, v, x, u, t) {
		p(function s() {
			w.strokeLayer(v, x, u, t)
		})
	};
	this.fillLayer = function(t, s) {
		p(function u() {
			t.fillLayer(s)
		})
	};
	this.push = function(t) {
		p(function s() {
			t.push()
		})
	};
	this.pop = function(t) {
		p(function s() {
			t.pop()
		})
	};
	this.reset = function(s) {
		p(function t() {
			s.reset()
		})
	};
	this.setTransform = function(u, t, s, z, x, w, v) {
		p(function y() {
			u.setTransform(t, s, z, x, w, v)
		})
	};
	this.transform = function(v, u, s, z, y, x, w) {
		p(function t() {
			v.transform(u, s, z, y, x, w)
		})
	};
	this.setChannelMask = function(t, s) {
		p(function u() {
			t.setChannelMask(s)
		})
	};
	this.setMiterLimit = function(u, s) {
		p(function t() {
			u.setMiterLimit(s)
		})
	};
	this.dispose = function q(s) {
		p(function t() {
			s.dispose()
		})
	};
	this.distort = function o(u, t, s, z, y, x, w) {
		p(function v() {
			u.distort(t, s, z, y, x, w)
		})
	};
	this.move = function l(t, u, s, A, w) {
		p(function v() {
			t.move(u, s, A, w)
		})
	};
	this.shade = function r(t, u) {
		p(function s() {
			t.shade(u)
		})
	};
	this.scale = function(s) {
		m.style.transform = m.style.WebkitTransform = m.style.MozTransform = m.style.OTransform = m.style.msTransform = "scale(" + s + "," + s + ")";
		k = s;
		h.style.width = (f * k) + "px";
		h.style.height = (c * k) + "px"
	};
	this.getScale = function() {
		return k
	};
	this.flatten = function() {
		var t = document.createElement("canvas");
		t.width = e.width;
		t.height = e.height;
		var u = t.getContext("2d");
		function s(z) {
			var y = [];
			for (var x in z.children) {
				y.push(z.children[x])
			}
			y.sort(function w(D, C) {
				var E = D.z - C.z;
				if (E !== 0) {
					return E
				}
				var B = D.getElement();
				var F = C.getElement();
				var A = F.compareDocumentPosition(B);
				if (A & Node.DOCUMENT_POSITION_PRECEDING) {
					return - 1
				}
				if (A & Node.DOCUMENT_POSITION_FOLLOWING) {
					return 1
				}
				return 0
			});
			return y
		}
		function v(C, z, E) {
			if (C.width > 0 && C.height > 0) {
				var w = u.globalAlpha;
				u.globalAlpha *= C.alpha / 255;
				u.drawImage(C.getCanvas(), z, E);
				var B = s(C);
				for (var A = 0; A < B.length; A++) {
					var D = B[A];
					v(D, z + D.x, E + D.y)
				}
				u.globalAlpha = w
			}
		}
		v(e, 0, 0);
		return t
	}
};
Guacamole.Display.VisibleLayer = function(f, a) {
	Guacamole.Layer.apply(this, [f, a]);
	var e = this;
	this.__unique_id = Guacamole.Display.VisibleLayer.__next_id++;
	this.alpha = 255;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.matrix = [1, 0, 0, 1, 0, 0];
	this.parent = null;
	this.children = {};
	var d = e.getCanvas();
	d.style.position = "absolute";
	d.style.left = "0px";
	d.style.top = "0px";
	var h = document.createElement("div");
	h.appendChild(d);
	h.style.width = f + "px";
	h.style.height = a + "px";
	h.style.position = "absolute";
	h.style.left = "0px";
	h.style.top = "0px";
	h.style.overflow = "hidden";
	var c = this.resize;
	this.resize = function(j, i) {
		h.style.width = j + "px";
		h.style.height = i + "px";
		c(j, i)
	};
	this.getElement = function() {
		return h
	};
	var g = "translate(0px, 0px)";
	var b = "matrix(1, 0, 0, 1, 0, 0)";
	this.translate = function(i, j) {
		e.x = i;
		e.y = j;
		g = "translate(" + i + "px," + j + "px)";
		h.style.transform = h.style.WebkitTransform = h.style.MozTransform = h.style.OTransform = h.style.msTransform = g + " " + b
	};
	this.move = function(j, i, m, l) {
		if (e.parent !== j) {
			if (e.parent) {
				delete e.parent.children[e.__unique_id]
			}
			e.parent = j;
			j.children[e.__unique_id] = e;
			var k = j.getElement();
			k.appendChild(h)
		}
		e.translate(i, m);
		e.z = l;
		h.style.zIndex = l
	};
	this.shade = function(i) {
		e.alpha = i;
		h.style.opacity = i / 255
	};
	this.dispose = function() {
		if (e.parent) {
			delete e.parent.children[e.__unique_id];
			e.parent = null
		}
		if (h.parentNode) {
			h.parentNode.removeChild(h)
		}
	};
	this.distort = function(j, i, n, m, l, k) {
		e.matrix = [j, i, n, m, l, k];
		b = "matrix(" + j + "," + i + "," + n + "," + m + "," + l + "," + k + ")";
		h.style.transform = h.style.WebkitTransform = h.style.MozTransform = h.style.OTransform = h.style.msTransform = g + " " + b
	}
};
Guacamole.Display.VisibleLayer.__next_id = 0;
var Guacamole = Guacamole || {};
Guacamole.InputStream = function(a, b) {
	var c = this;
	this.index = b;
	this.onblob = null;
	this.onend = null;
	this.sendAck = function(e, d) {
		a.sendAck(c.index, e, d)
	}
};
var Guacamole = Guacamole || {};
Guacamole.IntegerPool = function() {
	var b = this;
	var a = [];
	this.next_int = 0;
	this.next = function() {
		if (a.length > 0) {
			return a.shift()
		}
		return b.next_int++
	};
	this.free = function(c) {
		a.push(c)
	}
};
var Guacamole = Guacamole || {};
Guacamole.JSONReader = function guacamoleJSONReader(g) {
	var a = this;
	var f = new Guacamole.StringReader(g);
	var c = "";
	this.getLength = function b() {
		return c.length
	};
	this.getJSON = function d() {
		return JSON.parse(c)
	};
	f.ontext = function h(i) {
		c += i;
		if (a.onprogress) {
			a.onprogress(i.length)
		}
	};
	f.onend = function e() {
		if (a.onend) {
			a.onend()
		}
	};
	this.onprogress = null;
	this.onend = null
};
var Guacamole = Guacamole || {};
Guacamole.Keyboard = function(c) {
	var i = this;
	this.onkeydown = null;
	this.onkeyup = null;
	var v = function() {
		var A = this;
		this.timestamp = new Date().getTime();
		this.defaultPrevented = false;
		this.keysym = null;
		this.reliable = false;
		this.getAge = function() {
			return new Date().getTime() - A.timestamp
		}
	};
	var w = function(F, E, C, A) {
		v.apply(this);
		this.keyCode = F;
		this.keyIdentifier = E;
		this.key = C;
		this.location = A;
		this.keysym = y(C, A) || h(F, A);
		if (this.keysym && !s(this.keysym)) {
			this.reliable = true
		}
		if (!this.keysym && e(F, E)) {
			this.keysym = y(E, A, i.modifiers.shift)
		}
		var B = !i.modifiers.ctrl && !(navigator && navigator.platform && navigator.platform.match(/^mac/i));
		var D = !i.modifiers.alt;
		if ((D && i.modifiers.ctrl) || (B && i.modifiers.alt) || i.modifiers.meta || i.modifiers.hyper) {
			this.reliable = true
		}
		k[F] = this.keysym
	};
	w.prototype = new v();
	var b = function(A) {
		v.apply(this);
		this.charCode = A;
		this.keysym = q(A);
		this.reliable = true
	};
	b.prototype = new v();
	var j = function(D, C, B, A) {
		v.apply(this);
		this.keyCode = D;
		this.keyIdentifier = C;
		this.key = B;
		this.location = A;
		this.keysym = k[D] || h(D, A) || y(B, A);
		this.reliable = true
	};
	j.prototype = new v();
	var z = [];
	var u = {
		8 : [65288],
		9 : [65289],
		12 : [65291, 65291, 65291, 65461],
		13 : [65293],
		16 : [65505, 65505, 65506],
		17 : [65507, 65507, 65508],
		18 : [65513, 65513, 65027],
		19 : [65299],
		20 : [65509],
		27 : [65307],
		32 : [32],
		33 : [65365, 65365, 65365, 65465],
		34 : [65366, 65366, 65366, 65459],
		35 : [65367, 65367, 65367, 65457],
		36 : [65360, 65360, 65360, 65463],
		37 : [65361, 65361, 65361, 65460],
		38 : [65362, 65362, 65362, 65464],
		39 : [65363, 65363, 65363, 65462],
		40 : [65364, 65364, 65364, 65458],
		45 : [65379, 65379, 65379, 65456],
		46 : [65535, 65535, 65535, 65454],
		91 : [65515],
		92 : [65383],
		93 : null,
		96 : [65456],
		97 : [65457],
		98 : [65458],
		99 : [65459],
		100 : [65460],
		101 : [65461],
		102 : [65462],
		103 : [65463],
		104 : [65464],
		105 : [65465],
		106 : [65450],
		107 : [65451],
		109 : [65453],
		110 : [65454],
		111 : [65455],
		112 : [65470],
		113 : [65471],
		114 : [65472],
		115 : [65473],
		116 : [65474],
		117 : [65475],
		118 : [65476],
		119 : [65477],
		120 : [65478],
		121 : [65479],
		122 : [65480],
		123 : [65481],
		144 : [65407],
		145 : [65300],
		225 : [65027]
	};
	var f = {
		Again: [65382],
		AllCandidates: [65341],
		Alphanumeric: [65328],
		Alt: [65513, 65513, 65027],
		Attn: [64782],
		AltGraph: [65027],
		ArrowDown: [65364],
		ArrowLeft: [65361],
		ArrowRight: [65363],
		ArrowUp: [65362],
		Backspace: [65288],
		CapsLock: [65509],
		Cancel: [65385],
		Clear: [65291],
		Convert: [65313],
		Copy: [64789],
		Crsel: [64796],
		CrSel: [64796],
		CodeInput: [65335],
		Compose: [65312],
		Control: [65507, 65507, 65508],
		ContextMenu: [65383],
		DeadGrave: [65104],
		DeadAcute: [65105],
		DeadCircumflex: [65106],
		DeadTilde: [65107],
		DeadMacron: [65108],
		DeadBreve: [65109],
		DeadAboveDot: [65110],
		DeadUmlaut: [65111],
		DeadAboveRing: [65112],
		DeadDoubleacute: [65113],
		DeadCaron: [65114],
		DeadCedilla: [65115],
		DeadOgonek: [65116],
		DeadIota: [65117],
		DeadVoicedSound: [65118],
		DeadSemivoicedSound: [65119],
		Delete: [65535],
		Down: [65364],
		End: [65367],
		Enter: [65293],
		EraseEof: [64774],
		Escape: [65307],
		Execute: [65378],
		Exsel: [64797],
		ExSel: [64797],
		F1: [65470],
		F2: [65471],
		F3: [65472],
		F4: [65473],
		F5: [65474],
		F6: [65475],
		F7: [65476],
		F8: [65477],
		F9: [65478],
		F10: [65479],
		F11: [65480],
		F12: [65481],
		F13: [65482],
		F14: [65483],
		F15: [65484],
		F16: [65485],
		F17: [65486],
		F18: [65487],
		F19: [65488],
		F20: [65489],
		F21: [65490],
		F22: [65491],
		F23: [65492],
		F24: [65493],
		Find: [65384],
		GroupFirst: [65036],
		GroupLast: [65038],
		GroupNext: [65032],
		GroupPrevious: [65034],
		FullWidth: null,
		HalfWidth: null,
		HangulMode: [65329],
		Hankaku: [65321],
		HanjaMode: [65332],
		Help: [65386],
		Hiragana: [65317],
		HiraganaKatakana: [65319],
		Home: [65360],
		Hyper: [65517, 65517, 65518],
		Insert: [65379],
		JapaneseHiragana: [65317],
		JapaneseKatakana: [65318],
		JapaneseRomaji: [65316],
		JunjaMode: [65336],
		KanaMode: [65325],
		KanjiMode: [65313],
		Katakana: [65318],
		Left: [65361],
		Meta: [65511, 65511, 65512],
		ModeChange: [65406],
		NumLock: [65407],
		PageDown: [65366],
		PageUp: [65365],
		Pause: [65299],
		Play: [64790],
		PreviousCandidate: [65342],
		PrintScreen: [64797],
		Redo: [65382],
		Right: [65363],
		RomanCharacters: null,
		Scroll: [65300],
		Select: [65376],
		Separator: [65452],
		Shift: [65505, 65505, 65506],
		SingleCandidate: [65340],
		Super: [65515, 65515, 65516],
		Tab: [65289],
		Up: [65362],
		Undo: [65381],
		Win: [65515],
		Zenkaku: [65320],
		ZenkakuHankaku: [65322]
	};
	var r = {
		65027 : true,
		65505 : true,
		65506 : true,
		65507 : true,
		65508 : true,
		65511 : true,
		65512 : true,
		65513 : true,
		65514 : true,
		65515 : true,
		65516 : true
	};
	this.modifiers = new Guacamole.Keyboard.ModifierState();
	this.pressed = {};
	var n = {};
	var k = {};
	var d = null;
	var o = null;
	var l = function l(B, A) {
		if (!B) {
			return null
		}
		return B[A] || B[0]
	};
	var s = function s(A) {
		return (A >= 0 && A <= 255) || (A & 4294901760) === 16777216
	};
	function y(C, B, F) {
		if (!C) {
			return null
		}
		var E;
		var A = C.indexOf("U+");
		if (A >= 0) {
			var D = C.substring(A + 2);
			E = String.fromCharCode(parseInt(D, 16))
		} else {
			if (C.length === 1 && B !== 3) {
				E = C
			} else {
				return l(f[C], B)
			}
		}
		if (F === true) {
			E = E.toUpperCase()
		} else {
			if (F === false) {
				E = E.toLowerCase()
			}
		}
		var G = E.charCodeAt(0);
		return q(G)
	}
	function m(A) {
		return A <= 31 || (A >= 127 && A <= 159)
	}
	function q(A) {
		if (m(A)) {
			return 65280 | A
		}
		if (A >= 0 && A <= 255) {
			return A
		}
		if (A >= 256 && A <= 1114111) {
			return 16777216 | A
		}
		return null
	}
	function h(B, A) {
		return l(u[B], A)
	}
	var e = function e(D, C) {
		if (!C) {
			return false
		}
		var A = C.indexOf("U+");
		if (A === -1) {
			return true
		}
		var B = parseInt(C.substring(A + 2), 16);
		if (D !== B) {
			return true
		}
		if ((D >= 65 && D <= 90) || (D >= 48 && D <= 57)) {
			return true
		}
		return false
	};
	this.press = function(B) {
		if (B === null) {
			return
		}
		if (!i.pressed[B]) {
			i.pressed[B] = true;
			if (i.onkeydown) {
				var A = i.onkeydown(B);
				n[B] = A;
				window.clearTimeout(d);
				window.clearInterval(o);
				if (!r[B]) {
					d = window.setTimeout(function() {
						o = window.setInterval(function() {
							i.onkeyup(B);
							i.onkeydown(B)
						},
						50)
					},
					500)
				}
				return A
			}
		}
		return n[B] || false
	};
	this.release = function(A) {
		if (i.pressed[A]) {
			delete i.pressed[A];
			window.clearTimeout(d);
			window.clearInterval(o);
			if (A !== null && i.onkeyup) {
				i.onkeyup(A)
			}
		}
	};
	this.reset = function() {
		for (var A in i.pressed) {
			i.release(parseInt(A))
		}
		z = []
	};
	var a = function a(B) {
		var A = Guacamole.Keyboard.ModifierState.fromKeyboardEvent(B);
		if (i.modifiers.alt && A.alt === false) {
			i.release(65513);
			i.release(65514);
			i.release(65027)
		}
		if (i.modifiers.shift && A.shift === false) {
			i.release(65505);
			i.release(65506)
		}
		if (i.modifiers.ctrl && A.ctrl === false) {
			i.release(65507);
			i.release(65508)
		}
		if (i.modifiers.meta && A.meta === false) {
			i.release(65511);
			i.release(65512)
		}
		if (i.modifiers.hyper && A.hyper === false) {
			i.release(65515);
			i.release(65516)
		}
		i.modifiers = A
	};
	function g() {
		var B = p();
		if (!B) {
			return false
		}
		var A;
		do {
			A = B;
			B = p()
		} while ( B !== null );
		return A.defaultPrevented
	}
	var t = function t(A) {
		if (!i.modifiers.ctrl || !i.modifiers.alt) {
			return
		}
		if (A >= 65 && A <= 90) {
			return
		}
		if (A >= 97 && A <= 122) {
			return
		}
		if (A <= 255 || (A & 4278190080) === 16777216) {
			i.release(65507);
			i.release(65508);
			i.release(65513);
			i.release(65514)
		}
	};
	var p = function p() {
		var D = z[0];
		if (!D) {
			return null
		}
		if (D instanceof w) {
			var C = null;
			var E = [];
			if (D.reliable) {
				C = D.keysym;
				E = z.splice(0, 1)
			} else {
				if (z[1] instanceof b) {
					C = z[1].keysym;
					E = z.splice(0, 2)
				} else {
					if (z[1]) {
						C = D.keysym;
						E = z.splice(0, 1)
					}
				}
			}
			if (E.length > 0) {
				if (C) {
					t(C);
					var A = !i.press(C);
					k[D.keyCode] = C;
					if (i.modifiers.meta && C !== 65511 && C !== 65512) {
						i.release(C)
					}
					for (var B = 0; B < E.length; B++) {
						E[B].defaultPrevented = A
					}
				}
				return D
			}
		} else {
			if (D instanceof j) {
				var C = D.keysym;
				if (C) {
					i.release(C);
					D.defaultPrevented = true
				} else {
					i.reset();
					return D
				}
				return z.shift()
			} else {
				return z.shift()
			}
		}
		return null
	};
	var x = function x(A) {
		if ("location" in A) {
			return A.location
		}
		if ("keyLocation" in A) {
			return A.keyLocation
		}
		return 0
	};
	c.addEventListener("keydown",
	function(C) {
		if (!i.onkeydown) {
			return
		}
		var B;
		if (window.event) {
			B = window.event.keyCode
		} else {
			if (C.which) {
				B = C.which
			}
		}
		a(C);
		if (B === 229) {
			return
		}
		var A = new w(B, C.keyIdentifier, C.key, x(C));
		z.push(A);
		if (g()) {
			C.preventDefault()
		}
	},
	true);
	c.addEventListener("keypress",
	function(C) {
		if (!i.onkeydown && !i.onkeyup) {
			return
		}
		var B;
		if (window.event) {
			B = window.event.keyCode
		} else {
			if (C.which) {
				B = C.which
			}
		}
		a(C);
		var A = new b(B);
		z.push(A);
		if (g()) {
			C.preventDefault()
		}
	},
	true);
	c.addEventListener("keyup",
	function(C) {
		if (!i.onkeyup) {
			return
		}
		C.preventDefault();
		var B;
		if (window.event) {
			B = window.event.keyCode
		} else {
			if (C.which) {
				B = C.which
			}
		}
		a(C);
		var A = new j(B, C.keyIdentifier, C.key, x(C));
		z.push(A);
		g()
	},
	true)
};
Guacamole.Keyboard.ModifierState = function() {
	this.shift = false;
	this.ctrl = false;
	this.alt = false;
	this.meta = false;
	this.hyper = false
};
Guacamole.Keyboard.ModifierState.fromKeyboardEvent = function(b) {
	var a = new Guacamole.Keyboard.ModifierState();
	a.shift = b.shiftKey;
	a.ctrl = b.ctrlKey;
	a.alt = b.altKey;
	a.meta = b.metaKey;
	if (b.getModifierState) {
		a.hyper = b.getModifierState("OS") || b.getModifierState("Super") || b.getModifierState("Hyper") || b.getModifierState("Win")
	}
	return a
};
var Guacamole = Guacamole || {};
Guacamole.Layer = function(a, n) {
	var h = this;
	var l = 64;
	var d = document.createElement("canvas");
	var b = d.getContext("2d");
	b.save();
	var g = true;
	var e = true;
	var m = 0;
	var j = {
		1 : "destination-in",
		2 : "destination-out",
		4 : "source-in",
		6 : "source-atop",
		8 : "source-out",
		9 : "destination-atop",
		10 : "xor",
		11 : "destination-over",
		12 : "copy",
		14 : "source-over",
		15 : "lighter"
	};
	var c = function c(t, r) {
		t = t || 0;
		r = r || 0;
		var p = Math.ceil(t / l) * l;
		var s = Math.ceil(r / l) * l;
		if (d.width !== p || d.height !== s) {
			var u = null;
			if (!g && d.width !== 0 && d.height !== 0) {
				u = document.createElement("canvas");
				u.width = Math.min(h.width, t);
				u.height = Math.min(h.height, r);
				var q = u.getContext("2d");
				q.drawImage(d, 0, 0, u.width, u.height, 0, 0, u.width, u.height)
			}
			var o = b.globalCompositeOperation;
			d.width = p;
			d.height = s;
			if (u) {
				b.drawImage(u, 0, 0, u.width, u.height, 0, 0, u.width, u.height)
			}
			b.globalCompositeOperation = o;
			m = 0;
			b.save()
		} else {
			h.reset()
		}
		h.width = t;
		h.height = r
	};
	function f(o, v, p, q) {
		var t = p + o;
		var s = q + v;
		var r;
		if (t > h.width) {
			r = t
		} else {
			r = h.width
		}
		var u;
		if (s > h.height) {
			u = s
		} else {
			u = h.height
		}
		h.resize(r, u)
	}
	this.autosize = false;
	this.width = a;
	this.height = n;
	this.getCanvas = function k() {
		return d
	};
	this.toCanvas = function i() {
		var o = document.createElement("canvas");
		o.width = h.width;
		o.height = h.height;
		var p = o.getContext("2d");
		p.drawImage(h.getCanvas(), 0, 0);
		return o
	};
	this.resize = function(p, o) {
		if (p !== h.width || o !== h.height) {
			c(p, o)
		}
	};
	this.drawImage = function(o, q, p) {
		if (h.autosize) {
			f(o, q, p.width, p.height)
		}
		b.drawImage(p, o, q);
		g = false
	};
	this.transfer = function(A, r, p, s, D, B, z, u) {
		var t = A.getCanvas();
		if (r >= t.width || p >= t.height) {
			return
		}
		if (r + s > t.width) {
			s = t.width - r
		}
		if (p + D > t.height) {
			D = t.height - p
		}
		if (s === 0 || D === 0) {
			return
		}
		if (h.autosize) {
			f(B, z, s, D)
		}
		var o = A.getCanvas().getContext("2d").getImageData(r, p, s, D);
		var w = b.getImageData(B, z, s, D);
		for (var v = 0; v < s * D * 4; v += 4) {
			var q = new Guacamole.Layer.Pixel(o.data[v], o.data[v + 1], o.data[v + 2], o.data[v + 3]);
			var C = new Guacamole.Layer.Pixel(w.data[v], w.data[v + 1], w.data[v + 2], w.data[v + 3]);
			u(q, C);
			w.data[v] = C.red;
			w.data[v + 1] = C.green;
			w.data[v + 2] = C.blue;
			w.data[v + 3] = C.alpha
		}
		b.putImageData(w, B, z);
		g = false
	};
	this.put = function(u, q, p, r, w, v, t) {
		var s = u.getCanvas();
		if (q >= s.width || p >= s.height) {
			return
		}
		if (q + r > s.width) {
			r = s.width - q
		}
		if (p + w > s.height) {
			w = s.height - p
		}
		if (r === 0 || w === 0) {
			return
		}
		if (h.autosize) {
			f(v, t, r, w)
		}
		var o = u.getCanvas().getContext("2d").getImageData(q, p, r, w);
		b.putImageData(o, v, t);
		g = false
	};
	this.copy = function(s, q, p, r, u, o, v) {
		var t = s.getCanvas();
		if (q >= t.width || p >= t.height) {
			return
		}
		if (q + r > t.width) {
			r = t.width - q
		}
		if (p + u > t.height) {
			u = t.height - p
		}
		if (r === 0 || u === 0) {
			return
		}
		if (h.autosize) {
			f(o, v, r, u)
		}
		b.drawImage(t, q, p, r, u, o, v, r, u);
		g = false
	};
	this.moveTo = function(o, p) {
		if (e) {
			b.beginPath();
			e = false
		}
		if (h.autosize) {
			f(o, p, 0, 0)
		}
		b.moveTo(o, p)
	};
	this.lineTo = function(o, p) {
		if (e) {
			b.beginPath();
			e = false
		}
		if (h.autosize) {
			f(o, p, 0, 0)
		}
		b.lineTo(o, p)
	};
	this.arc = function(p, t, o, s, q, r) {
		if (e) {
			b.beginPath();
			e = false
		}
		if (h.autosize) {
			f(p, t, 0, 0)
		}
		b.arc(p, t, o, s, q, r)
	};
	this.curveTo = function(q, p, s, r, o, t) {
		if (e) {
			b.beginPath();
			e = false
		}
		if (h.autosize) {
			f(o, t, 0, 0)
		}
		b.bezierCurveTo(q, p, s, r, o, t)
	};
	this.close = function() {
		b.closePath();
		e = true
	};
	this.rect = function(o, r, p, q) {
		if (e) {
			b.beginPath();
			e = false
		}
		if (h.autosize) {
			f(o, r, p, q)
		}
		b.rect(o, r, p, q)
	};
	this.clip = function() {
		b.clip();
		e = true
	};
	this.strokeColor = function(s, v, q, u, t, o, p) {
		b.lineCap = s;
		b.lineJoin = v;
		b.lineWidth = q;
		b.strokeStyle = "rgba(" + u + "," + t + "," + o + "," + p / 255 + ")";
		b.stroke();
		g = false;
		e = true
	};
	this.fillColor = function(s, q, o, p) {
		b.fillStyle = "rgba(" + s + "," + q + "," + o + "," + p / 255 + ")";
		b.fill();
		g = false;
		e = true
	};
	this.strokeLayer = function(q, r, p, o) {
		b.lineCap = q;
		b.lineJoin = r;
		b.lineWidth = p;
		b.strokeStyle = b.createPattern(o.getCanvas(), "repeat");
		b.stroke();
		g = false;
		e = true
	};
	this.fillLayer = function(o) {
		b.fillStyle = b.createPattern(o.getCanvas(), "repeat");
		b.fill();
		g = false;
		e = true
	};
	this.push = function() {
		b.save();
		m++
	};
	this.pop = function() {
		if (m > 0) {
			b.restore();
			m--
		}
	};
	this.reset = function() {
		while (m > 0) {
			b.restore();
			m--
		}
		b.restore();
		b.save();
		b.beginPath();
		e = false
	};
	this.setTransform = function(p, o, t, s, r, q) {
		b.setTransform(p, o, t, s, r, q)
	};
	this.transform = function(p, o, t, s, r, q) {
		b.transform(p, o, t, s, r, q)
	};
	this.setChannelMask = function(o) {
		b.globalCompositeOperation = j[o]
	};
	this.setMiterLimit = function(o) {
		b.miterLimit = o
	};
	c(a, n);
	d.style.zIndex = -1
};
Guacamole.Layer.ROUT = 2;
Guacamole.Layer.ATOP = 6;
Guacamole.Layer.XOR = 10;
Guacamole.Layer.ROVER = 11;
Guacamole.Layer.OVER = 14;
Guacamole.Layer.PLUS = 15;
Guacamole.Layer.RIN = 1;
Guacamole.Layer.IN = 4;
Guacamole.Layer.OUT = 8;
Guacamole.Layer.RATOP = 9;
Guacamole.Layer.SRC = 12;
Guacamole.Layer.Pixel = function(f, e, c, d) {
	this.red = f;
	this.green = e;
	this.blue = c;
	this.alpha = d
};
var Guacamole = Guacamole || {};
Guacamole.Mouse = function(f) {
	var e = this;
	this.touchMouseThreshold = 3;
	this.scrollThreshold = 53;
	this.PIXELS_PER_LINE = 18;
	this.PIXELS_PER_PAGE = this.PIXELS_PER_LINE * 16;
	this.currentState = new Guacamole.Mouse.State(0, 0, false, false, false, false, false);
	this.onmousedown = null;
	this.onmouseup = null;
	this.onmousemove = null;
	this.onmouseout = null;
	var g = 0;
	var a = 0;
	function d(i) {
		i.stopPropagation();
		if (i.preventDefault) {
			i.preventDefault()
		}
		i.returnValue = false
	}
	f.addEventListener("contextmenu",
	function(i) {
		d(i)
	},
	false);
	f.addEventListener("mousemove",
	function(i) {
		d(i);
		if (g) {
			g--;
			return
		}
		e.currentState.fromClientPosition(f, i.clientX, i.clientY);
		if (e.onmousemove) {
			e.onmousemove(e.currentState)
		}
	},
	false);
	f.addEventListener("mousedown",
	function(i) {
		d(i);
		if (g) {
			return
		}
		switch (i.button) {
		case 0:
			e.currentState.left = true;
			break;
		case 1:
			e.currentState.middle = true;
			break;
		case 2:
			e.currentState.right = true;
			break
		}
		if (e.onmousedown) {
			e.onmousedown(e.currentState)
		}
	},
	false);
	f.addEventListener("mouseup",
	function(i) {
		d(i);
		if (g) {
			return
		}
		switch (i.button) {
		case 0:
			e.currentState.left = false;
			break;
		case 1:
			e.currentState.middle = false;
			break;
		case 2:
			e.currentState.right = false;
			break
		}
		if (e.onmouseup) {
			e.onmouseup(e.currentState)
		}
	},
	false);
	f.addEventListener("mouseout",
	function(j) {
		if (!j) {
			j = window.event
		}
		var i = j.relatedTarget || j.toElement;
		while (i) {
			if (i === f) {
				return
			}
			i = i.parentNode
		}
		d(j);
		if (e.currentState.left || e.currentState.middle || e.currentState.right) {
			e.currentState.left = false;
			e.currentState.middle = false;
			e.currentState.right = false;
			if (e.onmouseup) {
				e.onmouseup(e.currentState)
			}
		}
		if (e.onmouseout) {
			e.onmouseout()
		}
	},
	false);
	f.addEventListener("selectstart",
	function(i) {
		d(i)
	},
	false);
	function c() {
		g = e.touchMouseThreshold
	}
	f.addEventListener("touchmove", c, false);
	f.addEventListener("touchstart", c, false);
	f.addEventListener("touchend", c, false);
	function h(i) {
		var j = i.deltaY || -i.wheelDeltaY || -i.wheelDelta;
		if (j) {
			if (i.deltaMode === 1) {
				j = i.deltaY * e.PIXELS_PER_LINE
			} else {
				if (i.deltaMode === 2) {
					j = i.deltaY * e.PIXELS_PER_PAGE
				}
			}
		} else {
			j = i.detail * e.PIXELS_PER_LINE
		}
		a += j;
		if (a <= -e.scrollThreshold) {
			do {
				if (e.onmousedown) {
					e.currentState.up = true;
					e.onmousedown(e.currentState)
				}
				if (e.onmouseup) {
					e.currentState.up = false;
					e.onmouseup(e.currentState)
				}
				a += e.scrollThreshold
			} while ( a <= - e . scrollThreshold );
			a = 0
		}
		if (a >= e.scrollThreshold) {
			do {
				if (e.onmousedown) {
					e.currentState.down = true;
					e.onmousedown(e.currentState)
				}
				if (e.onmouseup) {
					e.currentState.down = false;
					e.onmouseup(e.currentState)
				}
				a -= e.scrollThreshold
			} while ( a >= e . scrollThreshold );
			a = 0
		}
		d(i)
	}
	f.addEventListener("DOMMouseScroll", h, false);
	f.addEventListener("mousewheel", h, false);
	f.addEventListener("wheel", h, false);
	var b = (function() {
		var j = document.createElement("div");
		if (! ("cursor" in j.style)) {
			return false
		}
		try {
			j.style.cursor = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEX///+nxBvIAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==) 0 0, auto"
		} catch(i) {
			return false
		}
		return /\burl\([^()]*\)\s+0\s+0\b/.test(j.style.cursor || "")
	})();
	this.setCursor = function(j, i, l) {
		if (b) {
			var k = j.toDataURL("image/png");
			f.style.cursor = "url(" + k + ") " + i + " " + l + ", auto";
			return true
		}
		return false
	}
};
Guacamole.Mouse.State = function(b, h, f, c, d, a, g) {
	var e = this;
	this.x = b;
	this.y = h;
	this.left = f;
	this.middle = c;
	this.right = d;
	this.up = a;
	this.down = g;
	this.fromClientPosition = function(j, n, m) {
		e.x = n - j.offsetLeft;
		e.y = m - j.offsetTop;
		var l = j.offsetParent;
		while (l && !(l === document.body)) {
			e.x -= l.offsetLeft - l.scrollLeft;
			e.y -= l.offsetTop - l.scrollTop;
			l = l.offsetParent
		}
		if (l) {
			var k = document.body.scrollLeft || document.documentElement.scrollLeft;
			var i = document.body.scrollTop || document.documentElement.scrollTop;
			e.x -= l.offsetLeft - k;
			e.y -= l.offsetTop - i
		}
	}
};
Guacamole.Mouse.Touchpad = function(d) {
	var c = this;
	this.scrollThreshold = 20 * (window.devicePixelRatio || 1);
	this.clickTimingThreshold = 250;
	this.clickMoveThreshold = 10 * (window.devicePixelRatio || 1);
	this.currentState = new Guacamole.Mouse.State(0, 0, false, false, false, false, false);
	this.onmousedown = null;
	this.onmouseup = null;
	this.onmousemove = null;
	var a = 0;
	var h = 0;
	var g = 0;
	var f = 0;
	var e = 0;
	var b = {
		1 : "left",
		2 : "right",
		3 : "middle"
	};
	var j = false;
	var i = null;
	d.addEventListener("touchend",
	function(m) {
		m.preventDefault();
		if (j && m.touches.length === 0) {
			var l = new Date().getTime();
			var k = b[a];
			if (c.currentState[k]) {
				c.currentState[k] = false;
				if (c.onmouseup) {
					c.onmouseup(c.currentState)
				}
				if (i) {
					window.clearTimeout(i);
					i = null
				}
			}
			if (l - f <= c.clickTimingThreshold && e < c.clickMoveThreshold) {
				c.currentState[k] = true;
				if (c.onmousedown) {
					c.onmousedown(c.currentState)
				}
				i = window.setTimeout(function() {
					c.currentState[k] = false;
					if (c.onmouseup) {
						c.onmouseup(c.currentState)
					}
					j = false
				},
				c.clickTimingThreshold)
			}
			if (!i) {
				j = false
			}
		}
	},
	false);
	d.addEventListener("touchstart",
	function(l) {
		l.preventDefault();
		a = Math.min(l.touches.length, 3);
		if (i) {
			window.clearTimeout(i);
			i = null
		}
		if (!j) {
			j = true;
			var k = l.touches[0];
			h = k.clientX;
			g = k.clientY;
			f = new Date().getTime();
			e = 0
		}
	},
	false);
	d.addEventListener("touchmove",
	function(m) {
		m.preventDefault();
		var q = m.touches[0];
		var p = q.clientX - h;
		var o = q.clientY - g;
		e += Math.abs(p) + Math.abs(o);
		if (a === 1) {
			var l = e / (new Date().getTime() - f);
			var n = 1 + l;
			c.currentState.x += p * n;
			c.currentState.y += o * n;
			if (c.currentState.x < 0) {
				c.currentState.x = 0
			} else {
				if (c.currentState.x >= d.offsetWidth) {
					c.currentState.x = d.offsetWidth - 1
				}
			}
			if (c.currentState.y < 0) {
				c.currentState.y = 0
			} else {
				if (c.currentState.y >= d.offsetHeight) {
					c.currentState.y = d.offsetHeight - 1
				}
			}
			if (c.onmousemove) {
				c.onmousemove(c.currentState)
			}
			h = q.clientX;
			g = q.clientY
		} else {
			if (a === 2) {
				if (Math.abs(o) >= c.scrollThreshold) {
					var k;
					if (o > 0) {
						k = "down"
					} else {
						k = "up"
					}
					c.currentState[k] = true;
					if (c.onmousedown) {
						c.onmousedown(c.currentState)
					}
					c.currentState[k] = false;
					if (c.onmouseup) {
						c.onmouseup(c.currentState)
					}
					h = q.clientX;
					g = q.clientY
				}
			}
		}
	},
	false)
};
Guacamole.Mouse.Touchscreen = function(e) {
	var d = this;
	var k = false;
	var j = null;
	var i = null;
	var l = null;
	var h = null;
	this.scrollThreshold = 20 * (window.devicePixelRatio || 1);
	this.clickTimingThreshold = 250;
	this.clickMoveThreshold = 16 * (window.devicePixelRatio || 1);
	this.longPressThreshold = 500;
	this.currentState = new Guacamole.Mouse.State(0, 0, false, false, false, false, false);
	this.onmousedown = null;
	this.onmouseup = null;
	this.onmousemove = null;
	function m(o) {
		if (!d.currentState[o]) {
			d.currentState[o] = true;
			if (d.onmousedown) {
				d.onmousedown(d.currentState)
			}
		}
	}
	function g(o) {
		if (d.currentState[o]) {
			d.currentState[o] = false;
			if (d.onmouseup) {
				d.onmouseup(d.currentState)
			}
		}
	}
	function c(o) {
		m(o);
		g(o)
	}
	function b(o, p) {
		d.currentState.fromClientPosition(e, o, p);
		if (d.onmousemove) {
			d.onmousemove(d.currentState)
		}
	}
	function a(o) {
		var r = o.touches[0] || o.changedTouches[0];
		var q = r.clientX - j;
		var p = r.clientY - i;
		return Math.sqrt(q * q + p * p) >= d.clickMoveThreshold
	}
	function f(o) {
		var p = o.touches[0];
		k = true;
		j = p.clientX;
		i = p.clientY
	}
	function n() {
		window.clearTimeout(l);
		window.clearTimeout(h);
		k = false
	}
	e.addEventListener("touchend",
	function(o) {
		if (!k) {
			return
		}
		if (o.touches.length !== 0 || o.changedTouches.length !== 1) {
			n();
			return
		}
		window.clearTimeout(h);
		g("left");
		if (!a(o)) {
			o.preventDefault();
			if (!d.currentState.left) {
				var p = o.changedTouches[0];
				b(p.clientX, p.clientY);
				m("left");
				l = window.setTimeout(function() {
					g("left");
					n()
				},
				d.clickTimingThreshold)
			}
		}
	},
	false);
	e.addEventListener("touchstart",
	function(o) {
		if (o.touches.length !== 1) {
			n();
			return
		}
		o.preventDefault();
		f(o);
		window.clearTimeout(l);
		h = window.setTimeout(function() {
			var p = o.touches[0];
			b(p.clientX, p.clientY);
			c("right");
			n()
		},
		d.longPressThreshold)
	},
	false);
	e.addEventListener("touchmove",
	function(o) {
		if (!k) {
			return
		}
		if (a(o)) {
			window.clearTimeout(h)
		}
		if (o.touches.length !== 1) {
			n();
			return
		}
		if (d.currentState.left) {
			o.preventDefault();
			var p = o.touches[0];
			b(p.clientX, p.clientY)
		}
	},
	false)
};
var Guacamole = Guacamole || {};
var Guacamole = Guacamole || {};
Guacamole.Object = function guacamoleObject(e, f) {
	var g = this;
	var h = {};
	var a = function a(j) {
		var k = h[j];
		if (!k) {
			return null
		}
		var l = k.shift();
		if (k.length === 0) {
			delete h[j]
		}
		return l
	};
	var d = function d(j, l) {
		var k = h[j];
		if (!k) {
			k = [];
			h[j] = k
		}
		k.push(l)
	};
	this.index = f;
	this.onbody = function i(l, j, k) {
		var m = a(k);
		if (m) {
			m(l, j)
		}
	};
	this.onundefine = null;
	this.requestInputStream = function c(k, j) {
		if (j) {
			d(k, j)
		}
		e.requestObjectInputStream(g.index, k)
	};
	this.createOutputStream = function b(j, k) {
		return e.createObjectOutputStream(g.index, j, k)
	}
};
Guacamole.Object.ROOT_STREAM = "/";
Guacamole.Object.STREAM_INDEX_MIMETYPE = "application/vnd.glyptodon.guacamole.stream-index+json";
var Guacamole = Guacamole || {};
Guacamole.OnScreenKeyboard = function(q) {
	var e = this;
	var h = {};
	var b = {};
	var d = [];
	var i = function i(u, v) {
		if (u.classList) {
			u.classList.add(v)
		} else {
			u.className += " " + v
		}
	};
	var j = function j(u, w) {
		if (u.classList) {
			u.classList.remove(w)
		} else {
			u.className = u.className.replace(/([^ ]+)[ ]*/g,
			function v(y, x) {
				if (x === w) {
					return ""
				}
				return y
			})
		}
	};
	var t = 0;
	var f = function f() {
		t = e.touchMouseThreshold
	};
	var r = function r(v, w, u, x) {
		this.width = w;
		this.height = u;
		this.scale = function(y) {
			v.style.width = (w * y) + "px";
			v.style.height = (u * y) + "px";
			if (x) {
				v.style.lineHeight = (u * y) + "px";
				v.style.fontSize = y + "px"
			}
		}
	};
	var l = function l(w) {
		for (var v = 0; v < w.length; v++) {
			var u = w[v];
			if (! (u in h)) {
				return false
			}
		}
		return true
	};
	var g = function g(w) {
		var x = e.keys[w];
		if (!x) {
			return null
		}
		for (var u = x.length - 1; u >= 0; u--) {
			var v = x[u];
			if (l(v.requires)) {
				return v
			}
		}
		return null
	};
	var m = function m(x, y) {
		if (!b[x]) {
			i(y, "guac-keyboard-pressed");
			var w = g(x);
			if (w.modifier) {
				var v = "guac-keyboard-modifier-" + n(w.modifier);
				var u = h[w.modifier];
				if (!u) {
					i(c, v);
					h[w.modifier] = w.keysym;
					if (e.onkeydown) {
						e.onkeydown(w.keysym)
					}
				} else {
					j(c, v);
					delete h[w.modifier];
					if (e.onkeyup) {
						e.onkeyup(u)
					}
				}
			} else {
				if (e.onkeydown) {
					e.onkeydown(w.keysym)
				}
			}
			b[x] = true
		}
	};
	var o = function o(v, w) {
		if (b[v]) {
			j(w, "guac-keyboard-pressed");
			var u = g(v);
			if (!u.modifier && e.onkeyup) {
				e.onkeyup(u.keysym)
			}
			b[v] = false
		}
	};
	var c = document.createElement("div");
	c.className = "guac-keyboard";
	c.onselectstart = c.onmousemove = c.onmouseup = c.onmousedown = function k(u) {
		if (t) {
			t--
		}
		u.stopPropagation();
		return false
	};
	this.touchMouseThreshold = 3;
	this.onkeydown = null;
	this.onkeyup = null;
	this.layout = new Guacamole.OnScreenKeyboard.Layout(q);
	this.getElement = function() {
		return c
	};
	this.resize = function(w) {
		var x = Math.floor(w * 10 / e.layout.width) / 10;
		for (var v = 0; v < d.length; v++) {
			var u = d[v];
			u.scale(x)
		}
	};
	var s = function s(v, u) {
		if (u instanceof Array) {
			var x = [];
			for (var w = 0; w < u.length; w++) {
				x.push(new Guacamole.OnScreenKeyboard.Key(u[w], v))
			}
			return x
		}
		if (typeof u === "number") {
			return [new Guacamole.OnScreenKeyboard.Key({
				name: v,
				keysym: u
			})]
		}
		if (typeof u === "string") {
			return [new Guacamole.OnScreenKeyboard.Key({
				name: v,
				title: u
			})]
		}
		return [new Guacamole.OnScreenKeyboard.Key(u, v)]
	};
	var a = function a(w) {
		var v = {};
		for (var u in q.keys) {
			v[u] = s(u, w[u])
		}
		return v
	};
	this.keys = a(q.keys);
	var n = function n(u) {
		var v = u.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[^A-Za-z0-9]+/g, "-").toLowerCase();
		return v
	};
	var p = function p(A, x, v) {
		var B;
		var u = document.createElement("div");
		if (v) {
			i(u, "guac-keyboard-" + n(v))
		}
		if (x instanceof Array) {
			i(u, "guac-keyboard-group");
			for (B = 0; B < x.length; B++) {
				p(u, x[B])
			}
		} else {
			if (x instanceof Object) {
				i(u, "guac-keyboard-group");
				var F = Object.keys(x).sort();
				for (B = 0; B < F.length; B++) {
					var v = F[B];
					p(u, x[v], v)
				}
			} else {
				if (typeof x === "number") {
					i(u, "guac-keyboard-gap");
					d.push(new r(u, x, x))
				} else {
					if (typeof x === "string") {
						var H = x;
						if (H.length === 1) {
							H = "0x" + H.charCodeAt(0).toString(16)
						}
						i(u, "guac-keyboard-key-container");
						var J = document.createElement("div");
						J.className = "guac-keyboard-key guac-keyboard-key-" + n(H);
						var I = e.keys[x];
						if (I) {
							for (B = 0; B < I.length; B++) {
								var G = I[B];
								var E = document.createElement("div");
								E.className = "guac-keyboard-cap";
								E.textContent = G.title;
								for (var y = 0; y < G.requires.length; y++) {
									var K = G.requires[y];
									i(E, "guac-keyboard-requires-" + n(K));
									i(J, "guac-keyboard-uses-" + n(K))
								}
								J.appendChild(E)
							}
						}
						u.appendChild(J);
						d.push(new r(u, e.layout.keyWidths[x] || 1, 1, true));
						var D = function D(L) {
							L.preventDefault();
							t = e.touchMouseThreshold;
							m(x, J)
						};
						var w = function w(L) {
							L.preventDefault();
							t = e.touchMouseThreshold;
							o(x, J)
						};
						var z = function z(L) {
							L.preventDefault();
							if (t === 0) {
								m(x, J)
							}
						};
						var C = function C(L) {
							L.preventDefault();
							if (t === 0) {
								o(x, J)
							}
						};
						J.addEventListener("touchstart", D, true);
						J.addEventListener("touchend", w, true);
						J.addEventListener("mousedown", z, true);
						J.addEventListener("mouseup", C, true);
						J.addEventListener("mouseout", C, true)
					}
				}
			}
		}
		A.appendChild(u)
	};
	p(c, q.layout)
};
Guacamole.OnScreenKeyboard.Layout = function(a) {
	this.language = a.language;
	this.type = a.type;
	this.keys = a.keys;
	this.layout = a.layout;
	this.width = a.width;
	this.keyWidths = a.keyWidths || {}
};
Guacamole.OnScreenKeyboard.Key = function(c, a) {
	this.name = a || c.name;
	this.title = c.title || this.name;
	this.keysym = c.keysym || (function b(e) {
		if (!e || e.length !== 1) {
			return null
		}
		var d = e.charCodeAt(0);
		if (d >= 0 && d <= 255) {
			return d
		}
		if (d >= 256 && d <= 1114111) {
			return 16777216 | d
		}
		return null
	})(this.title);
	this.modifier = c.modifier;
	this.requires = c.requires || []
};
var Guacamole = Guacamole || {};
Guacamole.OutputStream = function(a, b) {
	var c = this;
	this.index = b;
	this.onack = null;
	this.sendBlob = function(d) {
		a.sendBlob(c.index, d)
	};
	this.sendEnd = function() {
		a.endStream(c.index)
	}
};
var Guacamole = Guacamole || {};
Guacamole.Parser = function() {
	var e = this;
	var b = "";
	var d = [];
	var c = -1;
	var a = 0;
	this.receive = function(k) {
		if (a > 4096 && c >= a) {
			b = b.substring(a);
			c -= a;
			a = 0
		}
		b += k;
		while (c < b.length) {
			if (c >= a) {
				var h = b.substring(a, c);
				var g = b.substring(c, c + 1);
				d.push(h);
				if (g == ";") {
					var j = d.shift();
					if (e.oninstruction != null) {
						e.oninstruction(j, d)
					}
					d.length = 0
				} else {
					if (g != ",") {
						throw new Error("Illegal terminator.")
					}
				}
				a = c + 1
			}
			var f = b.indexOf(".", a);
			if (f != -1) {
				var i = parseInt(b.substring(c + 1, f));
				if (isNaN(i)) {
					throw new Error("Non-numeric character in element length.")
				}
				a = f + 1;
				c = a + i
			} else {
				a = b.length;
				break
			}
		}
	};
	this.oninstruction = null
};
var Guacamole = Guacamole || {};
Guacamole.RawAudioFormat = function RawAudioFormat(a) {
	this.bytesPerSample = a.bytesPerSample;
	this.channels = a.channels;
	this.rate = a.rate
};
Guacamole.RawAudioFormat.parse = function parseFormat(g) {
	var b;
	var f = null;
	var e = 1;
	if (g.substring(0, 9) === "audio/L8;") {
		g = g.substring(9);
		b = 1
	} else {
		if (g.substring(0, 10) === "audio/L16;") {
			g = g.substring(10);
			b = 2
		} else {
			return null
		}
	}
	var k = g.split(",");
	for (var d = 0; d < k.length; d++) {
		var j = k[d];
		var c = j.indexOf("=");
		if (c === -1) {
			return null
		}
		var a = j.substring(0, c);
		var h = j.substring(c + 1);
		switch (a) {
		case "channels":
			e = parseInt(h);
			break;
		case "rate":
			f = parseInt(h);
			break;
		default:
			return null
		}
	}
	if (f === null) {
		return null
	}
	return new Guacamole.RawAudioFormat({
		bytesPerSample: b,
		channels: e,
		rate: f
	})
};
var Guacamole = Guacamole || {};
Guacamole.SessionRecording = function SessionRecording(u) {
	var b = this;
	var l = 16384;
	var w = 5000;
	var p = [];
	var a = [];
	var q = 0;
	var i = 0;
	var r = new Guacamole.SessionRecording._PlaybackTunnel();
	var f = new Guacamole.Client(r);
	var k = -1;
	var g = null;
	var d = null;
	var v = null;
	f.connect();
	f.getDisplay().showCursor(false);
	u.oninstruction = function z(G, E) {
		var D = new Guacamole.SessionRecording._Frame.Instruction(G, E.slice());
		a.push(D);
		q += D.getSize();
		if (G === "sync") {
			var F = parseInt(E[0]);
			var H = new Guacamole.SessionRecording._Frame(F, a);
			p.push(H);
			if (p.length === 1 || (q >= l && F - i >= w)) {
				H.keyframe = true;
				i = F;
				q = 0
			}
			a = [];
			if (b.onprogress) {
				b.onprogress(b.getDuration())
			}
		}
	};
	var t = function t(D) {
		if (p.length === 0) {
			return 0
		}
		return D - p[0].timestamp
	};
	var n = function n(E, F, H) {
		if (E === F) {
			return E
		}
		var D = Math.floor((E + F) / 2);
		var G = t(p[D].timestamp);
		if (H < G && D > E) {
			return n(E, D - 1, H)
		}
		if (H > G && D < F) {
			return n(D + 1, F, H)
		}
		return D
	};
	var y = function y(E) {
		var G = p[E];
		for (var F = 0; F < G.instructions.length; F++) {
			var D = G.instructions[F];
			r.receiveInstruction(D.opcode, D.args)
		}
		if (G.keyframe && !G.clientState) {
			f.exportState(function H(I) {
				G.clientState = I
			})
		}
	};
	var m = function m(D) {
		var F;
		for (F = D; F >= 0; F--) {
			var E = p[F];
			if (F === k) {
				break
			}
			if (E.clientState) {
				f.importState(E.clientState);
				break
			}
		}
		F++;
		for (; F <= D; F++) {
			y(F)
		}
		k = D;
		if (b.onseek) {
			b.onseek(b.getPosition())
		}
	};
	var s = function s() {
		m(k + 1);
		if (k + 1 < p.length) {
			var E = p[k + 1];
			var G = E.timestamp - g + d;
			var D = Math.max(G - new Date().getTime(), 0);
			v = window.setTimeout(function F() {
				s()
			},
			D)
		} else {
			b.pause()
		}
	};
	this.onprogress = null;
	this.onplay = null;
	this.onpause = null;
	this.onseek = null;
	this.connect = function c(D) {
		u.connect(D)
	};
	this.disconnect = function A() {
		u.disconnect()
	};
	this.getDisplay = function o() {
		return f.getDisplay()
	};
	this.isPlaying = function h() {
		return !! g
	};
	this.getPosition = function B() {
		if (k === -1) {
			return 0
		}
		return t(p[k].timestamp)
	};
	this.getDuration = function C() {
		if (p.length === 0) {
			return 0
		}
		return t(p[p.length - 1].timestamp)
	};
	this.play = function x() {
		if (!b.isPlaying() && k + 1 < p.length) {
			if (b.onplay) {
				b.onplay()
			}
			var D = p[k + 1];
			g = D.timestamp;
			d = new Date().getTime();
			s()
		}
	};
	this.seek = function e(D) {
		if (p.length === 0) {
			return
		}
		var E = b.isPlaying();
		b.pause();
		m(n(0, p.length - 1, D));
		if (E) {
			b.play()
		}
	};
	this.pause = function j() {
		if (b.isPlaying()) {
			if (b.onpause) {
				b.onpause()
			}
			window.clearTimeout(v);
			g = null;
			d = null
		}
	}
};
Guacamole.SessionRecording._Frame = function _Frame(b, a) {
	this.keyframe = false;
	this.timestamp = b;
	this.instructions = a;
	this.clientState = null
};
Guacamole.SessionRecording._Frame.Instruction = function Instruction(d, b) {
	var a = this;
	this.opcode = d;
	this.args = b;
	this.getSize = function c() {
		var f = a.opcode.length;
		for (var e = 0; e < a.args.length; e++) {
			f += a.args[e].length
		}
		return f
	}
};
Guacamole.SessionRecording._PlaybackTunnel = function _PlaybackTunnel() {
	var e = this;
	this.connect = function b(f) {};
	this.sendMessage = function c(f) {};
	this.disconnect = function a() {};
	this.receiveInstruction = function d(g, f) {
		if (e.oninstruction) {
			e.oninstruction(g, f)
		}
	}
};
var Guacamole = Guacamole || {};
Guacamole.Status = function(b, a) {
	var c = this;
	this.code = b;
	this.message = a;
	this.isError = function() {
		return c.code < 0 || c.code > 255
	}
};
Guacamole.Status.Code = {
	SUCCESS: 0,
	UNSUPPORTED: 256,
	SERVER_ERROR: 512,
	SERVER_BUSY: 513,
	UPSTREAM_TIMEOUT: 514,
	UPSTREAM_ERROR: 515,
	RESOURCE_NOT_FOUND: 516,
	RESOURCE_CONFLICT: 517,
	RESOURCE_CLOSED: 518,
	UPSTREAM_NOT_FOUND: 519,
	UPSTREAM_UNAVAILABLE: 520,
	SESSION_CONFLICT: 521,
	SESSION_TIMEOUT: 522,
	SESSION_CLOSED: 523,
	CLIENT_BAD_REQUEST: 768,
	CLIENT_UNAUTHORIZED: 769,
	CLIENT_FORBIDDEN: 771,
	CLIENT_TIMEOUT: 776,
	CLIENT_OVERRUN: 781,
	CLIENT_BAD_TYPE: 783,
	CLIENT_TOO_MANY: 797
};
var Guacamole = Guacamole || {};
Guacamole.StringReader = function(e) {
	var d = this;
	var b = new Guacamole.ArrayBufferReader(e);
	var f = 0;
	var c = 0;
	function a(h) {
		var l = "";
		var g = new Uint8Array(h);
		for (var j = 0; j < g.length; j++) {
			var k = g[j];
			if (f === 0) {
				if ((k | 127) === 127) {
					l += String.fromCharCode(k)
				} else {
					if ((k | 31) === 223) {
						c = k & 31;
						f = 1
					} else {
						if ((k | 15) === 239) {
							c = k & 15;
							f = 2
						} else {
							if ((k | 7) === 247) {
								c = k & 7;
								f = 3
							} else {
								l += "\uFFFD"
							}
						}
					}
				}
			} else {
				if ((k | 63) === 191) {
					c = (c << 6) | (k & 63);
					f--;
					if (f === 0) {
						l += String.fromCharCode(c)
					}
				} else {
					f = 0;
					l += "\uFFFD"
				}
			}
		}
		return l
	}
	b.ondata = function(g) {
		var h = a(g);
		if (d.ontext) {
			d.ontext(h)
		}
	};
	b.onend = function() {
		if (d.onend) {
			d.onend()
		}
	};
	this.ontext = null;
	this.onend = null
};
var Guacamole = Guacamole || {};
Guacamole.StringWriter = function(h) {
	var e = this;
	var c = new Guacamole.ArrayBufferWriter(h);
	var a = new Uint8Array(8192);
	var g = 0;
	c.onack = function(i) {
		if (e.onack) {
			e.onack(i)
		}
	};
	function f(i) {
		if (g + i >= a.length) {
			var j = new Uint8Array((g + i) * 2);
			j.set(a);
			a = j
		}
		g += i
	}
	function d(m) {
		var k;
		var j;
		if (m <= 127) {
			k = 0;
			j = 1
		} else {
			if (m <= 2047) {
				k = 192;
				j = 2
			} else {
				if (m <= 65535) {
					k = 224;
					j = 3
				} else {
					if (m <= 2097151) {
						k = 240;
						j = 4
					} else {
						d(65533);
						return
					}
				}
			}
		}
		f(j);
		var n = g - 1;
		for (var l = 1; l < j; l++) {
			a[n--] = 128 | (m & 63);
			m >>= 6
		}
		a[n] = k | m
	}
	function b(m) {
		for (var j = 0; j < m.length; j++) {
			var l = m.charCodeAt(j);
			d(l)
		}
		if (g > 0) {
			var k = a.subarray(0, g);
			g = 0;
			return k
		}
	}
	this.sendText = function(i) {
		if (i.length) {
			c.sendData(b(i))
		}
	};
	this.sendEnd = function() {
		c.sendEnd()
	};
	this.onack = null
};
var Guacamole = Guacamole || {};
Guacamole.Tunnel = function() {
	this.connect = function(a) {};
	this.disconnect = function() {};
	this.sendMessage = function(a) {};
	this.state = Guacamole.Tunnel.State.CONNECTING;
	this.receiveTimeout = 15000;
	this.uuid = null;
	this.onerror = null;
	this.onstatechange = null;
	this.oninstruction = null
};
Guacamole.Tunnel.INTERNAL_DATA_OPCODE = "";
Guacamole.Tunnel.State = {
	CONNECTING: 0,
	OPEN: 1,
	CLOSED: 2
};
Guacamole.HTTPTunnel = function(g, k) {
	var q = this;
	var i = g + "?connect";
	var t = g + "?read:";
	var j = g + "?write:";
	var h = 1;
	var l = 0;
	var r = h;
	var o = false;
	var f = "";
	var c = !!k;
	var d = null;
	function b() {
		window.clearTimeout(d);
		d = window.setTimeout(function() {
			a(new Guacamole.Status(Guacamole.Status.Code.UPSTREAM_TIMEOUT, "Server timeout."))
		},
		q.receiveTimeout)
	}
	function a(u) {
		if (q.state === Guacamole.Tunnel.State.CLOSED) {
			return
		}
		if (u.code !== Guacamole.Status.Code.SUCCESS && q.onerror) {
			if (q.state === Guacamole.Tunnel.State.CONNECTING || u.code !== Guacamole.Status.Code.RESOURCE_NOT_FOUND) {
				q.onerror(u)
			}
		}
		q.state = Guacamole.Tunnel.State.CLOSED;
		o = false;
		if (q.onstatechange) {
			q.onstatechange(q.state)
		}
	}
	this.sendMessage = function() {
		if (q.state !== Guacamole.Tunnel.State.OPEN) {
			return
		}
		if (arguments.length === 0) {
			return
		}
		function v(y) {
			var x = new String(y);
			return x.length + "." + x
		}
		var w = v(arguments[0]);
		for (var u = 1; u < arguments.length; u++) {
			w += "," + v(arguments[u])
		}
		w += ";";
		f += w;
		if (!o) {
			n()
		}
	};
	function n() {
		if (q.state !== Guacamole.Tunnel.State.OPEN) {
			return
		}
		if (f.length > 0) {
			o = true;
			var u = new XMLHttpRequest();
			u.open("POST", j + q.uuid);
			u.withCredentials = c;
			u.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
			u.onreadystatechange = function() {
				if (u.readyState === 4) {
					if (u.status !== 200) {
						m(u)
					} else {
						n()
					}
				}
			};
			u.send(f);
			f = ""
		} else {
			o = false
		}
	}
	function m(w) {
		var v = parseInt(w.getResponseHeader("Guacamole-Status-Code"));
		var u = w.getResponseHeader("Guacamole-Error-Message");
		a(new Guacamole.Status(v, u))
	}
	function s(x) {
		var u = null;
		var z = null;
		var w = 0;
		var v = -1;
		var A = 0;
		var y = new Array();
		function B() {
			if (q.state !== Guacamole.Tunnel.State.OPEN) {
				if (u !== null) {
					clearInterval(u)
				}
				return
			}
			if (x.readyState < 2) {
				return
			}
			var C;
			try {
				C = x.status
			} catch(J) {
				C = 200
			}
			if (!z && C === 200) {
				z = p()
			}
			if (x.readyState === 3 || x.readyState === 4) {
				b();
				if (r === h) {
					if (x.readyState === 3 && !u) {
						u = setInterval(B, 30)
					} else {
						if (x.readyState === 4 && u) {
							clearInterval(u)
						}
					}
				}
				if (x.status === 0) {
					q.disconnect();
					return
				} else {
					if (x.status !== 200) {
						m(x);
						return
					}
				}
				var I;
				try {
					I = x.responseText
				} catch(J) {
					return
				}
				while (v < I.length) {
					if (v >= A) {
						var E = I.substring(A, v);
						var D = I.substring(v, v + 1);
						y.push(E);
						if (D === ";") {
							var H = y.shift();
							if (q.oninstruction) {
								q.oninstruction(H, y)
							}
							y.length = 0
						}
						A = v + 1
					}
					var F = I.indexOf(".", A);
					if (F !== -1) {
						var G = parseInt(I.substring(v + 1, F));
						if (G === 0) {
							if (u) {
								clearInterval(u)
							}
							x.onreadystatechange = null;
							x.abort();
							if (z) {
								s(z)
							}
							break
						}
						A = F + 1;
						v = A + G
					} else {
						A = I.length;
						break
					}
				}
			}
		}
		if (r === h) {
			x.onreadystatechange = function() {
				if (x.readyState === 3) {
					w++;
					if (w >= 2) {
						r = l;
						x.onreadystatechange = B
					}
				}
				B()
			}
		} else {
			x.onreadystatechange = B
		}
		B()
	}
	var e = 0;
	function p() {
		var u = new XMLHttpRequest();
		u.open("GET", t + q.uuid + ":" + (e++));
		u.withCredentials = c;
		u.send(null);
		return u
	}
	this.connect = function(u) {
		b();
		var v = new XMLHttpRequest();
		v.onreadystatechange = function() {
			if (v.readyState !== 4) {
				return
			}
			if (v.status !== 200) {
				m(v);
				return
			}
			b();
			q.uuid = v.responseText;
			q.state = Guacamole.Tunnel.State.OPEN;
			if (q.onstatechange) {
				q.onstatechange(q.state)
			}
			s(p())
		};
		v.open("POST", i, true);
		v.withCredentials = c;
		v.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
		v.send(u)
	};
	this.disconnect = function() {
		a(new Guacamole.Status(Guacamole.Status.Code.SUCCESS, "Manually closed."))
	}
};
Guacamole.HTTPTunnel.prototype = new Guacamole.Tunnel();
Guacamole.WebSocketTunnel = function(c) {
	var e = this;
	var f = null;
	var a = null;
	var b = {
		"http:": "ws:",
		"https:": "wss:"
	};
	if (c.substring(0, 3) !== "ws:" && c.substring(0, 4) !== "wss:") {
		var h = b[window.location.protocol];
		if (c.substring(0, 1) === "/") {
			c = h + "//" + window.location.host + c
		} else {
			var d = window.location.pathname.lastIndexOf("/");
			var j = window.location.pathname.substring(0, d + 1);
			c = h + "//" + window.location.host + j + c
		}
	}
	function i() {
		window.clearTimeout(a);
		a = window.setTimeout(function() {
			g(new Guacamole.Status(Guacamole.Status.Code.UPSTREAM_TIMEOUT, "Server timeout."))
		},
		e.receiveTimeout)
	}
	function g(k) {
		if (e.state === Guacamole.Tunnel.State.CLOSED) {
			return
		}
		if (k.code !== Guacamole.Status.Code.SUCCESS && e.onerror) {
			e.onerror(k)
		}
		e.state = Guacamole.Tunnel.State.CLOSED;
		if (e.onstatechange) {
			e.onstatechange(e.state)
		}
		f.close()
	}
	this.sendMessage = function(n) {
		if (e.state !== Guacamole.Tunnel.State.OPEN) {
			return
		}
		if (arguments.length === 0) {
			return
		}
		function l(p) {
			var o = new String(p);
			return o.length + "." + o
		}
		var m = l(arguments[0]);
		for (var k = 1; k < arguments.length; k++) {
			m += "," + l(arguments[k])
		}
		m += ";";
		f.send(m)
	};
	this.connect = function(k) {
		i();
		// f = new WebSocket(c);
		f = new WebSocket(c + "?" + k);
		// f = new WebSocket(c + "?" + k, "guacamole");
		f.onopen = function(l) {
			i()
		};
		f.onclose = function(l) {
			g(new Guacamole.Status(parseInt(l.reason), l.reason))
		};
		f.onerror = function(l) {
			g(new Guacamole.Status(Guacamole.Status.Code.SERVER_ERROR, l.data))
		};
		f.onmessage = function(n) {
			i();
			var u = n.data;
			var s = 0;
			var r;
			var m = [];
			do {
				var t = u.indexOf(".", s);
				if (t !== -1) {
					var o = parseInt(u.substring(r + 1, t));
					s = t + 1;
					r = s + o
				} else {
					g(new Guacamole.Status(Guacamole.Status.Code.SERVER_ERROR, "Incomplete instruction."))
				}
				var q = u.substring(s, r);
				var l = u.substring(r, r + 1);
				m.push(q);
				if (l === ";") {
					var p = m.shift();
					if (e.state !== Guacamole.Tunnel.State.OPEN) {
						if (p === Guacamole.Tunnel.INTERNAL_DATA_OPCODE) {
							e.uuid = m[0]
						}
						e.state = Guacamole.Tunnel.State.OPEN;
						if (e.onstatechange) {
							e.onstatechange(e.state)
						}
					}
					if (p !== Guacamole.Tunnel.INTERNAL_DATA_OPCODE && e.oninstruction) {
						e.oninstruction(p, m)
					}
					m.length = 0
				}
				s = r + 1
			} while ( s < u . length )
		}
	};
	this.disconnect = function() {
		g(new Guacamole.Status(Guacamole.Status.Code.SUCCESS, "Manually closed."))
	}
};
Guacamole.WebSocketTunnel.prototype = new Guacamole.Tunnel();
Guacamole.ChainedTunnel = function(e) {
	var c = this;
	var a;
	var g = [];
	var f = null;
	for (var d = 0; d < arguments.length; d++) {
		g.push(arguments[d])
	}
	function b(j) {
		c.disconnect = j.disconnect;
		c.sendMessage = j.sendMessage;
		var i = function i(k) {
			if (k && k.code === Guacamole.Status.Code.UPSTREAM_TIMEOUT) {
				g = [];
				return null
			}
			var l = g.shift();
			if (l) {
				j.onerror = null;
				j.oninstruction = null;
				j.onstatechange = null;
				b(l)
			}
			return l
		};
		function h() {
			j.onstatechange = c.onstatechange;
			j.oninstruction = c.oninstruction;
			j.onerror = c.onerror;
			c.uuid = j.uuid;
			f = j
		}
		j.onstatechange = function(k) {
			switch (k) {
			case Guacamole.Tunnel.State.OPEN:
				h();
				if (c.onstatechange) {
					c.onstatechange(k)
				}
				break;
			case Guacamole.Tunnel.State.CLOSED:
				if (!i() && c.onstatechange) {
					c.onstatechange(k)
				}
				break
			}
		};
		j.oninstruction = function(l, k) {
			h();
			if (c.oninstruction) {
				c.oninstruction(l, k)
			}
		};
		j.onerror = function(k) {
			if (!i(k) && c.onerror) {
				c.onerror(k)
			}
		};
		j.connect(a)
	}
	this.connect = function(i) {
		a = i;
		var h = f ? f: g.shift();
		if (h) {
			b(h)
		} else {
			if (c.onerror) {
				c.onerror(Guacamole.Status.Code.SERVER_ERROR, "No tunnels to try.")
			}
		}
	}
};
Guacamole.ChainedTunnel.prototype = new Guacamole.Tunnel();
Guacamole.StaticHTTPTunnel = function StaticHTTPTunnel(a, b) {
	var f = this;
	var h = null;
	var d = function d(j) {
		if (j !== f.state) {
			f.state = j;
			if (f.onstatechange) {
				f.onstatechange(j)
			}
		}
	};
	var c = function c(j) {
		switch (j) {
		case 400:
			return Guacamole.Status.Code.CLIENT_BAD_REQUEST;
		case 403:
			return Guacamole.Status.Code.CLIENT_FORBIDDEN;
		case 404:
			return Guacamole.Status.Code.RESOURCE_NOT_FOUND;
		case 429:
			return Guacamole.Status.Code.CLIENT_TOO_MANY;
		case 503:
			return Guacamole.Status.Code.SERVER_BUSY
		}
		return Guacamole.Status.Code.SERVER_ERROR
	};
	this.sendMessage = function e(j) {};
	this.connect = function i(k) {
		f.disconnect();
		d(Guacamole.Tunnel.State.CONNECTING);
		h = new XMLHttpRequest();
		h.open("GET", a);
		h.withCredentials = !!b;
		h.responseType = "text";
		h.send(null);
		var m = 0;
		var o = new Guacamole.Parser();
		o.oninstruction = function n(q, p) {
			if (f.oninstruction) {
				f.oninstruction(q, p)
			}
		};
		h.onreadystatechange = function l() {
			if (h.readyState === 3 || h.readyState === 4) {
				d(Guacamole.Tunnel.State.OPEN);
				var p = h.responseText;
				var q = p.length;
				if (m < q) {
					o.receive(p.substring(m));
					m = q
				}
			}
			if (h.readyState === 4) {
				f.disconnect()
			}
		};
		h.onerror = function j() {
			if (f.onerror) {
				f.onerror(new Guacamole.Status(c(h.status), h.statusText))
			}
			f.disconnect()
		}
	};
	this.disconnect = function g() {
		if (h) {
			h.abort();
			h = null
		}
		d(Guacamole.Tunnel.State.CLOSED)
	}
};
Guacamole.StaticHTTPTunnel.prototype = new Guacamole.Tunnel();
var Guacamole = Guacamole || {};
Guacamole.API_VERSION = "0.9.13-incubating";
var Guacamole = Guacamole || {};
Guacamole.VideoPlayer = function VideoPlayer() {
	this.sync = function a() {}
};
Guacamole.VideoPlayer.isSupportedType = function isSupportedType(a) {
	return false
};
Guacamole.VideoPlayer.getSupportedTypes = function getSupportedTypes() {
	return []
};
Guacamole.VideoPlayer.getInstance = function getInstance(c, b, a) {
	return null
};
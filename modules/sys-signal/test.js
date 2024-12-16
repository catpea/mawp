const A = new Signal(1);
const B = new Signal('HOLA');

B.addDependency(A);
B.subscribe((v, a)=>console.log('XXXXXX', v,a))

setInterval(function () {
A.update(v => v+1);
}, 1_000)

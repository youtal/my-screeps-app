class c1{
    public say(){
        console.log(`original class running`);
    }
}

class c2 extends c1{
    public say() {
        //super.say();
        console.log(`extend class running`);
    }
}

function t(){
    c1.prototype['say'] = c2.prototype['say']
    let a = new c1()
    a.say()
}

t()
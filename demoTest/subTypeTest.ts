import disableAutomock = jest.disableAutomock;

interface SubTypeTestT1 {
    name: string,
    age: number
}

interface SubTypeTestT2 {
    name: string,
    age: number,
    isMarried: boolean
}

function getName(p: SubTypeTestT1) {
    return p.name;
}

function getAge(p: SubTypeTestT2) {
    return p.age;
}

let p1: SubTypeTestT1;
let p2: SubTypeTestT2;

getName(p2);
//error
//getAge(p1)

function isType(data: any): data is NodeList  {
    return true;
}

function trr(data){
    if (isType(data))
        console.log(data.item(1.));
}
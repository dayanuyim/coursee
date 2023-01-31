
export function groupItems(arr, getKeyFun)
{
    const group = {};
    arr.forEach(item => {
        const key =  getKeyFun(item);
        if(!(key in group))
            group[key] = [];
        group[key].push(item);
    });
    return group;
}

export function joinpath(...paths){
    const sp = '/';

    let sum = paths.shift();
    for(const p of paths){
        if(sum.endsWith(sp))
            sum += p.startsWith(sp)? p.substring(sp.length): p;
        else
            sum += p.startsWith(sp)? p: sp+p;
    }
    return sum;
}


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

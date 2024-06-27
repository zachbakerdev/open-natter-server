const padEmailCode = (num: number, size: number): string => {
    return ("000000" + num).substring(-size);
}

const generateEmailCode = (): string => {
    const key = Math.floor(Math.random() * 1000000);
    return padEmailCode(key, 6);
}

export default generateEmailCode;
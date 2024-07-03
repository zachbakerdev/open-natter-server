const padEmailCode = (num: number, size: number): string => {
    const combined = "00000" + num.toString();
    return combined.substring(combined.length - size);
}

const generateEmailCode = (): string => {
    const key = Math.floor(Math.random() * 1000000);
    return padEmailCode(key, 6);
}

export default generateEmailCode;
export const isImageData = (image: any) => {
    if(!image)
    {
        return false;
    }
    const regex = /^data\:image/gm;
    if (image.match(regex)) {
        return true;
    }
    return false;
};

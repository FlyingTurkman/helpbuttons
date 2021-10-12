///image included in ButtonCard
///Btn is the project convention for tradittional buttons, in order to avoidd confussion with app's buttons
import React from "react";
import Image from 'next/image'



export enum ImageType {
    avatar,
    popup,
    marker,
    mapCard,
    listCard,
    buttonCard,
}

export enum ContentAlignment {
    left,
    center,
    right,
}

interface ImageProps {
    height?: string;
    width?: string;
    layout?: string;
    src: string;
    alt: string;
    objectFit?: string;
    imageType: ImageType;
}


export default function ImageWrapper({
    height = "200",
    width = "200",
    alt = null,
    layout = "responsive",
    src = null,
    objectFit = "contain",
    imageType = ImageType.popup,
}: ImageProps) {
    let classNames = [];

    switch (imageType) {
        case ImageType.popup:
            width = "200";
            height = "100";
            break;
        case ImageType.marker:
            break;
        case ImageType.mapCard:
            break;
        case ImageType.listCard:
            layout = "responsive";
            width = "1000";
            height = "1000";
            break;
        case ImageType.buttonCard:
            break;
        default:
            break;
    }

    const className = classNames.join(" ");

    return (
          <Image
            src={src}
            alt={alt}
            layout={layout}
            width={width}
            height={height}
          />
    );
}

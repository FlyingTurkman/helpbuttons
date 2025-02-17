///Btn is the project convention for tradittional buttons, in order to avoidd confussion with app's buttons
import React from "react";
import Spinner from "elements/Spinner";

export enum BtnType {
    corporative,
    splitIcon,
    filter,
    submit,
    link,
    dropdown,
    circle,
    iconActions,
}

export enum IconType {
    color,
    green,
    svg,
    splitRedGreen,
    circle,
    iconLink,
}
export enum ContentAlignment {
    left,
    center,
    right,
}
interface BtnProps {
    caption?: string;
    iconLink?: string;
    iconLeft?: IconType;
    iconRight?: IconType;
    contentAlignment?: ContentAlignment;
    btnType?: BtnType;
    disabled?: boolean;
    isSubmitting?: boolean;
    onClick?: Function;
    submit?: boolean;
    extraClass?:string;
    backgroundColor?:string;
}

function BtnIcon({ icon, color, iconLink}: { icon: IconType }) {
    switch (icon) {
        case IconType.color:
            return <div className="btn-filter__icon" 
           style={ {
                'background': color,
                '--button-color': color,
              } as React.CSSProperties
            }
            ></div>;
        case IconType.svg:
            return <div className="btn-with-icon__icon">{iconLink}</div>;
        case IconType.circle:
            return <div className="btn-circle__icon">{iconLink}</div>;
        case IconType.splitRedGreen:
            return (
                <div className="btn-filter__split-icon">
                    <div className="btn-filter__split-icon--half green-l"></div>
                    <div className="btn-filter__split-icon--half red-r"></div>
                </div>
            );
        default:
            return null;
    }
}

function CaptionNode({
    caption,
    hasIcon = false,
}: {
    caption: string;
    hasIcon: boolean;
}) {
    if (hasIcon) {
        return <div className="btn-with-icon__text">{caption}</div>;
    } else {
        return <>{caption}</>;
    }
}

export default function Btn({
    caption,
    extraClass = "",
    iconRight = null,
    iconLeft = null,
    iconLink = null,
    btnType = null,
    contentAlignment = null,
    disabled = false,
    isSubmitting = false,
    onClick = () => {},
    submit = false,
    backgroundColor,
}: BtnProps) {
    let classNames = [];
    const hasIcon = iconRight !== null || iconLeft !== null;

    switch (contentAlignment) {
        case ContentAlignment.center:
            classNames.push("btn--center");
            break;
    }

    switch (btnType) {
        case BtnType.corporative:
            classNames.push("btn btn--corporative");
            break;
        case BtnType.submit:
            classNames.push("btn btn--black");
            break;
        case BtnType.link:
            classNames.push("btn btn--link");
            break;
        case BtnType.filter:
            if (hasIcon) {
                classNames.push("btn-filter-with-icon");
            } else {
                classNames.push("btn-filter");
            }
            break;
        case BtnType.dropdown:
            classNames.push("dropdown__dropdown");
            break;
        case BtnType.circle:
            classNames.push("btn btn--corporative btn-circle");
            break;
        case BtnType.iconActions:
            classNames.push("btn btn-circle--big-icon");
            break;
        default:
            if (hasIcon) {
                classNames.push("btn-with-icon");
            } else {
                classNames.push("btn");
            }
            break;
    }

    const className = classNames.join(" ");

    let attr = {}
    if(submit){
        attr = {...attr, type:"submit"};
    }else{
        attr = {...attr, type: "button"};
    }
        
    return (
        <button {...attr} onClick={onClick} disabled={disabled} className={className + ' ' + extraClass}   
        >
            {isSubmitting && <Spinner />}
            <BtnIcon icon={iconLeft} iconLink={iconLink} 
            style={
                {
                  'background-color': backgroundColor,
                  '--button-color': backgroundColor,
                } as React.CSSProperties}
            />
            <CaptionNode caption={caption} hasIcon={hasIcon} 
            />
            <BtnIcon icon={iconRight} iconLink={iconLink}
            />
        </button>
    );
}
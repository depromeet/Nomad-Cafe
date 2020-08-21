import React, { useCallback } from "react";
import FloatingActionButtonStyled from "./FloatingActionButton.styles";

export default function FloatingActionButton(props) {
  const { children } = props;

  const handleClick = useCallback(() => {
    props.onClick && props.onClick();
  }, []);

  return <FloatingActionButtonStyled onClick={handleClick}>{children}</FloatingActionButtonStyled>;
}

FloatingActionButton.defaultProps = {
  children: null,
  onClick: null,
};

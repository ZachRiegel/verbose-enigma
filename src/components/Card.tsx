import React from 'react';
import {GameCard} from "src/types";
import styled from "@emotion/styled";


const Square = styled.div`
  width: 5cqw;
  height: 5cqw;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
const CardImage = styled.img`
  min-height: 100%;
  aspect-ratio: 63 / 88;
`;

const Card = ({
                card
              }: {
  card: GameCard
}) => {
  return <Square>
    <CardImage/>
  </Square>
};

export default Card;
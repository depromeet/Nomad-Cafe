import styled from "styled-components";

const CardInfoStyled = styled.div`
  width: 100%;
  height: 96px;
  margin-top: 13px;

  .info-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    color: #222222;
  }
  .card-title {
    width: 250px;
    height: 21px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 18px;
    font-weight: bold;
    padding-right: 5px;
  }
  .distance {
    display: flex;
    justify-content: space-between;
    line-height: 1.33;
    font-size: 12px;
  }
  .distance > span {
    margin-left: 4px;
  }

  .location {
    font-size: 11px;
    font-weight: 14px;
    color: #a7a7a7;
  }
`;

export default CardInfoStyled;

import Header from "../components/Header"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import Paper from "@mui/material/Paper"
import dynamic from "next/dynamic"
import axios from "axios"
import {
  Container,
  DauWrapper,
  DauBox,
  Caption,
  Title,
  Subtitle,
} from "../styles/Custom"

const ComponentsWithNoSSR = dynamic(() => import("../components/BarChart"), {
  ssr: false,
})

const PieChartWithNoSSR = dynamic(() => import("../components/PieChart"), {
  ssr: false,
})

const type = [
  "Empty",
  "Register",
  "Deposit",
  "Deposit Nft",
  "Transfer",
  "Withdraw",
  "Create Collection",
  "Mint Nft",
  "Transfer Nft",
  "Atomic Match",
  "Cancel Offer",
  "Withdraw Nft",
  "Full Exit",
  "Full Exit Nft",
]

export default function DAU() {
  const [DAU, setDAU] = useState(0)
  const [yesterdayDAU, setYesterdayDAU] = useState(0)
  const [graphData, setGraphData] = useState({})
  const [pieChartData, setPieChartData] = useState({})

  const itemsPerPage = 100

  const getRecursive = async (offset = 0, maxItems, temp) => {
    if (maxItems < offset) {
      const count = {}
      const countType = {}

      temp.forEach((ele) => {
        if (
          count[new Date(ele.created_at * 1000).toLocaleDateString()] ===
          undefined
        )
          count[new Date(ele.created_at * 1000).toLocaleDateString()] = 1
        else count[new Date(ele.created_at * 1000).toLocaleDateString()] += 1

        if (countType[type[ele.type]] === undefined)
          countType[type[ele.type]] = 1
        else countType[type[ele.type]] += 1
      })

      const sortedCountType = Object.entries(countType)
        .sort(([, a], [, b]) => a - b)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {})

      setPieChartData(sortedCountType)
      setGraphData(count)
      return
    }
    const { data } = await axios.get(
      `https://api-testnet.zkbnbchain.org/api/v1/executedTxs?offset=${offset}&limit=${itemsPerPage}`
    )
    temp = [...temp, ...data.txs]

    await getRecursive(offset + itemsPerPage, maxItems, temp)
  }

  const getDAU = async () => {
    const { data } = await axios.get(
      `https://api-testnet.zkbnbchain.org/api/v1/executedTxs?offset=0&limit=${itemsPerPage}`
    )
    const yesterday = new Date()
    const doubleYesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    doubleYesterday.setDate(doubleYesterday.getDate() - 2)

    const yesterdayUTC = yesterday.getTime() / 1000
    const doubleYesterdayUTC = doubleYesterday.getTime() / 1000

    setDAU(data.txs.filter((x) => x.created_at > yesterdayUTC).length)
    setYesterdayDAU(
      data.txs.filter(
        (x) => x.created_at > doubleYesterdayUTC && x.created_at < yesterdayUTC
      ).length
    )

    getRecursive(0, data.total, [])
  }

  useEffect(() => {
    getDAU()
  }, [])

  return (
    <>
      <Container>
        <DauWrapper>
          <DauBox>
            <Caption>Today Transactions</Caption>
            <Title>{DAU}</Title>
          </DauBox>
          <DauBox>
            <Caption>Yesterday Transactions</Caption>
            <Title>{yesterdayDAU}</Title>
          </DauBox>
          <DauBox>
            <Caption>DoD Transactions Change rate</Caption>
            <Title>
              {(((DAU - yesterdayDAU) / yesterdayDAU) * 100).toFixed(2)}%
            </Title>
            <Subtitle>DoD Change(%)</Subtitle>
          </DauBox>
          <DauBox>
            <Caption>DoD Transactions Change</Caption>
            <Title>{DAU - yesterdayDAU} DoD Change</Title>
            <Subtitle>DoD Change</Subtitle>
          </DauBox>
        </DauWrapper>
        <PieChartWithNoSSR
          pieChartData={Object.values(pieChartData).map(
            (x) =>
              (x / Object.values(pieChartData).reduce((acc, x) => acc + x)) *
              100
          )}
          pieLabel={Object.keys(pieChartData).map((x) => `${x}(%)`)}
        />
      </Container>
      <Container style={{ marginTop: "-200px" }}>
        <ComponentsWithNoSSR
          chartData={Object.values(graphData)}
          chartLabel={Object.keys(graphData)}
          topLabel={"zkBNBChain Stats-DAU & Transactions"}
        />
      </Container>
    </>
  )
}

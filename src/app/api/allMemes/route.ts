/* eslint-disable @typescript-eslint/no-unused-vars */

import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const baseURL = "https://reddit-scraper2.p.rapidapi.com/sub_posts";

const api_key = process.env.NEXT_PUBLIC_API_SECRET;
const api_host = process.env.NEXT_PUBLIC_API_HOST;

type memeData = {
  id: string;
  title: string;
  creation_date: string;
  content_image: string;
  original_post: string;
  upvote_ratio: number;
  total_comments: number;
  score: number;
  shares: number;
};

interface ApiResponse {
  data: {
    id: string;
    title: string;
    creationDate: string;
    content: {
      image: string;
    };
    url: string;
    upvoteRatio: number;
    comments: number;
    score: number;
    shares: number;
  }[];

  pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchAllData = async (): Promise<memeData[]> => {
  const allData: memeData[] = [];
  let endCursor = "";
  let hasNextPage = true;
  let i = 0;

  while (hasNextPage) {
    try {
      const response = await axios.request<ApiResponse>({
        method: "GET",
        url: baseURL,
        params: {
          sub: "memes",
          time: "YEAR",
          cursor: endCursor || undefined,
        },
        headers: {
          "x-rapidapi-key": api_key,
          "x-rapidapi-host": api_host,
        },
      });

      const { data, pageInfo } = response.data;

      const formattedData: memeData[] = data
        .map((item) => ({
          id: item.id,
          title: item.title,
          creation_date: item.creationDate,
          content_image: item.content.image,
          original_post: item.url,
          upvote_ratio: item.upvoteRatio,
          total_comments: item.comments,
          score: item.score,
          shares: item.shares,
        }))
        .filter((post: memeData) => post.total_comments > 0);

      allData.push(...formattedData);
      endCursor = pageInfo.endCursor;
      hasNextPage = pageInfo.hasNextPage;
      console.log(`Fetched page ${i}`);
      i += 1;

      await sleep(2000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.status === 429) {
        console.warn("Rate limit hit! Retrying after delay...");
        await sleep(5000);
      } else {
        console.error("Error fetching data:", error);
        break;
      }
    }
  }

  return allData;
};

export async function GET(req: NextRequest) {
  try {
    const allMemeData = await fetchAllData();
    console.log(allMemeData.length);
    return NextResponse.json(allMemeData);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

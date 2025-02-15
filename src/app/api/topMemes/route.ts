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
}

const request_options = {
  method: "GET",
  url: baseURL,
  params: {
    sub: "memes",
    sort: "TOP",
    time: "YEAR",
  },
  headers: {
    "x-rapidapi-key": api_key,
    "x-rapidapi-host": api_host,
  },
};

export async function GET(req: NextRequest) {
  try {
    const { data } = await axios.request(request_options);

    const formattedData: memeData[] = data.data.map((data: ApiResponse) => ({
      id: data.id,
      title: data.title,
      creation_date: data.creationDate,
      content_image: data.content.image,
      original_post: data.url,
      upvote_ratio: data.upvoteRatio,
      total_comments: data.comments,
      score: data.score,
      shares: data.shares,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

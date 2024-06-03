from typing import TypedDict, List


class YouTubeScrappingData(TypedDict):
    author: str
    videoId: str
    title: str
    keywords: List[str]
    viewCount: str
    shortDescription: str
    transcript: str

from enum import Enum

class SourceType(Enum):
    YOUTUBE = 1
    PODCAST = 2
    RECIPE = 3
    PAPER = 4
    # ...

"""Represents one scraping job in the queue."""
class ScrapingDataElement:
    def __init__(self, _key ,_url, _source_type, _text_data = None, _metadata = None):
        self.key = _key
        self.url = _url
        self.source_type = _source_type
        self.text_data = _text_data
        self.metadata = _metadata

# MARK: Metadata definitions

class PodcastMetadata:
    def __init__(self, _filename):
        self.filename = _filename

class YoutubeMetadata:
    def __init__(self, _video_title, _upload_date, _num_clicks):
        self.video_title = _video_title
        self.upload_date = _upload_date
        self.num_clicks = _num_clicks
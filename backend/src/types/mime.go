package types

type Mime string

const (
	// images
	Png  Mime = "image/png"
	Jpeg Mime = "image/jpeg"
	Gif  Mime = "image/gif"
	Bmp  Mime = "image/bmp"
	Webp Mime = "image/webp"
	Svg  Mime = "image/svg+xml"

	// text
	Txt        Mime = "text/plain"
	Html       Mime = "text/html"
	Css        Mime = "text/css"
	Csv        Mime = "text/csv"
	Javascript Mime = "text/javascript"

	// application
	Json   Mime = "application/json"
	Pdf    Mime = "application/pdf"
	Zip    Mime = "application/zip"
	Rar    Mime = "application/x-rar-compressed"
	SevenZ Mime = "application/x-7z-compressed"
	Xls    Mime = "application/vnd.ms-excel"
	Xlsx   Mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	Ppt    Mime = "application/vnd.ms-powerpoint"
	Doc    Mime = "application/msword"
	Docx   Mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	Form   Mime = "application/x-www-form-urlencoded"

	// audio
	Mp3  Mime = "audio/mpeg"
	Ogg  Mime = "audio/ogg"
	Wav  Mime = "audio/wav"
	Acc  Mime = "audio/aac"
	Weba Mime = "audio/webm"

	// video
	Mp4     Mime = "video/mp4"
	Mpeg    Mime = "video/mpeg"
	Ogv     Mime = "video/ogg"
	Webm    Mime = "video/webm"
	ThreeGp Mime = "video/3gpp"
	Avi     Mime = "video/x-msvideo"

	// other
	Bin     Mime = "application/octet-stream"
	Swf     Mime = "application/x-shockwave-flash"
	Epub    Mime = "application/epub+zip"
	Torrent Mime = "application/x-bittorrent"
)

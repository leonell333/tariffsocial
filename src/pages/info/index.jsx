import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function HTMLLoader() {
  const [html, setHtml] = useState('')
  const { type } = useParams()
  useEffect(() => {
    fetch(`/infos/${type}.html`)
      .then((res) => res.text())
      .then((data) => setHtml(data))
  }, [])

  return (
      <div
        className="p-10 font-[Times_New_Roman] !text-[18px]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
  )
}

export default HTMLLoader
